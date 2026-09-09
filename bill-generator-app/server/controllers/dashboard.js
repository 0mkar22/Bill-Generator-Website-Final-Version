const supabase = require('../config/db');
const { calculateItemAmount } = require('../utils/helpers');

/**
 * Controller to fetch aggregated executive analytics for the dashboard.
 * Executes parallel Supabase queries to compute financial KPIs, operational tallies,
 * and an interleaved recent activity feed.
 */
exports.getDashboardSummary = async (req, res) => {
  try {
    // 1. Parallel fetch of all primary datasets
    const [invoicesRes, payoutsRes, workOrdersRes, companiesRes] = await Promise.all([
      supabase.from('invoices').select('*').order('createdAt', { ascending: false }),
      supabase.from('personnel_payouts').select('*, workOrders(entryNumber, eventDate)').order('created_at', { ascending: false }),
      supabase.from('workOrders').select('*').order('eventDate', { ascending: false }),
      supabase.from('companies').select('*')
    ]);

    if (invoicesRes.error) throw invoicesRes.error;
    if (payoutsRes.error) throw payoutsRes.error;
    if (workOrdersRes.error) throw workOrdersRes.error;
    if (companiesRes.error) throw companiesRes.error;

    const rawInvoices = invoicesRes.data || [];
    const rawPayouts = payoutsRes.data || [];
    const rawWorkOrders = workOrdersRes.data || [];
    const rawCompanies = companiesRes.data || [];

    // 2. Build index maps for fast lookups
    const companiesMap = new Map();
    rawCompanies.forEach(c => companiesMap.set(c.id, c));

    const allItemsMap = new Map();
    rawWorkOrders.forEach(order => {
      (order.workItems || []).forEach((item, index) => {
        const uniqueId = item.id || `entry-${order.entryNumber}-item-${index}`;
        allItemsMap.set(uniqueId, { ...item, id: uniqueId, parent: order });
      });
    });

    // Helper: Compute gross invoice amount (with 18% GST standard)
    const getInvoiceCalculatedTotal = (inv) => {
      let invItems = [];
      try {
        invItems = Array.isArray(inv.workItems)
          ? inv.workItems
          : (typeof inv.workItems === 'string' ? JSON.parse(inv.workItems || '[]') : []);
      } catch (e) {
        invItems = [];
      }

      const itemsForInvoice = invItems.map(id => allItemsMap.get(id)).filter(Boolean);
      const companyDetails = companiesMap.get(inv.company_id) || {};
      const amountBeforeTax = itemsForInvoice.reduce(
        (sum, item) => sum + (calculateItemAmount(item, companyDetails) || 0),
        0
      );
      return Math.round(amountBeforeTax * 1.18);
    };

    // 3. De-duplicate invoices by invoiceNumber to prevent duplicate count
    const uniqueInvoicesMap = new Map();
    rawInvoices.forEach(inv => {
      const key = inv.invoiceNumber || inv.id;
      if (!uniqueInvoicesMap.has(key)) {
        uniqueInvoicesMap.set(key, inv);
      }
    });
    const uniqueInvoices = Array.from(uniqueInvoicesMap.values());

    // 4. Financial Calculations
    let totalRevenue = 0;
    let outstandingReceivables = 0;
    let paidInvoicesCount = 0;
    let unpaidInvoicesCount = 0;

    const companyRevenueMap = new Map();

    uniqueInvoices.forEach(inv => {
      const calcTotal = getInvoiceCalculatedTotal(inv);
      const recAmt = Number(inv.amount_received);

      if (inv.status === 'paid') {
        paidInvoicesCount += 1;
        const finalEarned = !isNaN(recAmt) && recAmt > 0 ? recAmt : calcTotal;
        totalRevenue += finalEarned;

        // Company revenue breakdown
        const comp = companiesMap.get(inv.company_id);
        const compName = comp?.company_name || 'Direct / Miscellaneous';
        const existing = companyRevenueMap.get(compName) || { revenue: 0, count: 0 };
        companyRevenueMap.set(compName, {
          revenue: existing.revenue + finalEarned,
          count: existing.count + 1
        });
      } else {
        unpaidInvoicesCount += 1;
        const pendingAmount = Math.max(0, calcTotal - (!isNaN(recAmt) ? recAmt : 0));
        outstandingReceivables += pendingAmount;
      }
    });

    const totalDisbursed = rawPayouts.reduce(
      (sum, p) => sum + (Number(p.amount_paid) || 0),
      0
    );

    const netProfit = totalRevenue - totalDisbursed;
    const profitMargin = totalRevenue > 0
      ? Number(((netProfit / totalRevenue) * 100).toFixed(1))
      : 0;

    // 5. Operations & Workforce Calculations
    const totalWorkOrders = rawWorkOrders.length;
    
    // Active vs Completed events (active if eventDate is today or future, or within last 3 days)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    let activeWorkOrders = 0;
    let totalPersonnelDeployed = 0;
    const allAssignedPersonnelKeys = new Set();
    const settledPersonnelKeys = new Set();

    rawPayouts.forEach(p => {
      if (p.event_id && p.personnel_name) {
        settledPersonnelKeys.add(`${p.event_id}__${p.personnel_name.trim().toLowerCase()}`);
      }
    });

    rawWorkOrders.forEach(order => {
      const orderDate = order.eventDate ? new Date(order.eventDate) : null;
      if (orderDate && orderDate >= threeDaysAgo) {
        activeWorkOrders += 1;
      }

      (order.workItems || []).forEach(item => {
        let pList = item.personnel || [];
        if (Array.isArray(pList)) {
          pList.forEach(p => {
            if (p && p.name) {
              totalPersonnelDeployed += 1;
              allAssignedPersonnelKeys.add(`${order.id}__${p.name.trim().toLowerCase()}`);
            }
          });
        }
      });
    });

    const completedWorkOrders = Math.max(0, totalWorkOrders - activeWorkOrders);

    // Calculate pending payouts (personnel assigned in orders that have no payout record)
    let pendingPayoutsCount = 0;
    for (const key of allAssignedPersonnelKeys) {
      if (!settledPersonnelKeys.has(key)) {
        pendingPayoutsCount += 1;
      }
    }

    // 6. Recent Financial Activity Feed (Interleaved Top Inflows & Outflows)
    const paymentActivities = uniqueInvoices
      .filter(inv => inv.status === 'paid')
      .slice(0, 12)
      .map(inv => {
        const comp = companiesMap.get(inv.company_id);
        const recAmt = Number(inv.amount_received);
        const amount = !isNaN(recAmt) && recAmt > 0 ? recAmt : getInvoiceCalculatedTotal(inv);
        return {
          id: `inv-${inv.id}`,
          type: 'payment_received',
          title: 'Payment Received',
          description: `Invoice #${inv.invoiceNumber}${comp?.company_name ? ` • ${comp.company_name}` : (inv.recipient ? ` • ${inv.recipient}` : '')}`,
          amount,
          date: inv.createdAt,
          status: 'completed',
          referenceId: inv.invoiceNumber
        };
      });

    const payoutActivities = rawPayouts.slice(0, 12).map(p => {
      const woEntry = p.workOrders?.entryNumber ? `WO #${p.workOrders.entryNumber}` : 'Payout';
      const roleStr = [p.work_name, p.duration].filter(Boolean).join(' • ');
      return {
        id: `payout-${p.id}`,
        type: 'payout_disbursed',
        title: 'Crew Payout Disbursed',
        description: `${p.personnel_name}${roleStr ? ` • ${roleStr}` : ''} (${woEntry})`,
        amount: Number(p.amount_paid) || 0,
        date: p.created_at || p.payment_date,
        status: 'disbursed',
        referenceId: p.workOrders?.entryNumber ? `WO-${p.workOrders.entryNumber}` : (p.id ? p.id.slice(0, 8) : 'PAY')
      };
    });

    const recentActivity = [...paymentActivities, ...payoutActivities]
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
      .slice(0, 15);

    // 7. Top Companies Breakdown
    const companyBreakdown = Array.from(companyRevenueMap.entries())
      .map(([companyName, data]) => ({
        companyName,
        revenue: data.revenue,
        invoiceCount: data.count
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // 8. Return cohesive aggregated response
    return res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalRevenue,
          totalDisbursed,
          netProfit,
          profitMargin,
          outstandingReceivables,
          paidInvoicesCount,
          unpaidInvoicesCount
        },
        operations: {
          totalWorkOrders,
          activeWorkOrders,
          completedWorkOrders,
          totalPersonnelDeployed,
          pendingPayoutsCount,
          totalPayoutsCompleted: rawPayouts.length
        },
        recentActivity,
        companyBreakdown
      }
    });
  } catch (err) {
    console.error('Dashboard Summary Controller Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to aggregate dashboard summary',
      details: err.message
    });
  }
};
