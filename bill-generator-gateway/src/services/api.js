import axios from 'axios';
import { supabase } from '../supabase';
import { calculateItemAmount } from '../utils/helpers';

const API = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api'
});

API.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export const createWorkOrder = (workOrderData) => API.post('/workOrders', workOrderData);
export const getWorkOrders = () => API.get('/workOrders');

export const getCompanies = () => API.get('/companies');
export const createCompany = (data) => API.post('/companies', data);
export const updateCompany = (id, data) => API.put(`/companies/${id}`, data);

export const getTeam = () => API.get('/team');
export const upsertTeam = (data) => API.post('/team', data);

export default API;

export const updateInvoiceStatus = (id, status) => API.patch(`/invoices/${id}/status`, { status });
export const getPayouts = () => API.get('/personnelPayouts');
export const createPayout = (data) => API.post('/personnelPayouts', data);
export const deletePayout = (id) => API.delete(`/personnelPayouts/${id}`);

export const updatePayout = (id, data) => API.put(`/personnelPayouts/${id}`, data);

export const updateInvoiceAmountReceived = (id, amount_received) => API.patch(`/invoices/${id}/amount-received`, { amount_received });

/**
 * Direct client-side Supabase aggregation fallback.
 * Ensures the dashboard always renders live data with zero downtime
 * even if the Express container is rebuilding or temporarily unavailable.
 */
export const fetchDashboardSummaryDirect = async () => {
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

  const companiesMap = new Map();
  rawCompanies.forEach(c => companiesMap.set(c.id, c));

  const allItemsMap = new Map();
  rawWorkOrders.forEach(order => {
    (order.workItems || []).forEach((item, index) => {
      const uniqueId = item.id || `entry-${order.entryNumber}-item-${index}`;
      allItemsMap.set(uniqueId, { ...item, id: uniqueId, parent: order });
    });
  });

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

  const uniqueInvoicesMap = new Map();
  rawInvoices.forEach(inv => {
    const key = inv.invoiceNumber || inv.id;
    if (!uniqueInvoicesMap.has(key)) {
      uniqueInvoicesMap.set(key, inv);
    }
  });
  const uniqueInvoices = Array.from(uniqueInvoicesMap.values());

  let totalRevenue = 0;
  let totalAmountReceived = 0;
  let totalTdsAndOther = 0;
  let totalGst = 0;
  let totalRevenueExGst = 0;
  let outstandingReceivables = 0;
  let paidInvoicesCount = 0;
  let unpaidInvoicesCount = 0;
  const companyRevenueMap = new Map();

  uniqueInvoices.forEach(inv => {
    const calcTotal = getInvoiceCalculatedTotal(inv);

    if (inv.status === 'paid') {
      paidInvoicesCount += 1;
      totalRevenue += calcTotal;

      // Individual paid invoice GST separation (18% GST reverse calculation)
      const invoiceGst = Math.round(calcTotal * (18 / 118));
      const invoiceBase = calcTotal - invoiceGst;
      totalGst += invoiceGst;
      totalRevenueExGst += invoiceBase;

      // TDS & Other is 3% of Base Amount (Without GST Invoice Amount)
      const invoiceTds = Math.round(invoiceBase * 0.03);
      // Amount Received is Invoice Amount - 3% of Base Amount
      const invoiceAmountReceived = calcTotal - invoiceTds;

      totalTdsAndOther += invoiceTds;
      totalAmountReceived += invoiceAmountReceived;

      const comp = companiesMap.get(inv.company_id);
      const compName = comp?.company_name || 'Direct / Miscellaneous';
      const existing = companyRevenueMap.get(compName) || { revenue: 0, count: 0 };
      companyRevenueMap.set(compName, {
        revenue: existing.revenue + invoiceAmountReceived,
        count: existing.count + 1
      });
    } else {
      unpaidInvoicesCount += 1;
      outstandingReceivables += calcTotal;
    }
  });

  const totalCrewWages = rawPayouts.reduce(
    (sum, p) => sum + (Number(p.amount_paid) || 0),
    0
  );

  let totalTravelExpense = 0;
  let totalFoodExpense = 0;
  let totalStayExpense = 0;

  rawWorkOrders.forEach(order => {
    totalTravelExpense += Number(order.travel_expense ?? order.workItems?.[0]?.travelExpense) || 0;
    totalFoodExpense += Number(order.food_expense ?? order.workItems?.[0]?.foodExpense) || 0;
    totalStayExpense += Number(order.stay_expense ?? order.workItems?.[0]?.stayExpense) || 0;
  });

  const totalEventExpenses = totalTravelExpense + totalFoodExpense + totalStayExpense;
  const totalCombinedExpenses = totalCrewWages + totalEventExpenses + totalGst;

  // TDS and Other from paid invoices (replaces amount yet to pay)
  const amountYetToPay = totalTdsAndOther;

  // Net Operating Profit based on Amount Received and Expenses
  const netProfit = totalAmountReceived - totalCombinedExpenses;
  const profitMargin = totalAmountReceived > 0
    ? Number(((netProfit / totalAmountReceived) * 100).toFixed(1))
    : 0;

  const totalWorkOrders = rawWorkOrders.length;
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

  let pendingPayoutsCount = 0;
  for (const key of allAssignedPersonnelKeys) {
    if (!settledPersonnelKeys.has(key)) {
      pendingPayoutsCount += 1;
    }
  }

  const paymentActivities = uniqueInvoices
    .filter(inv => inv.status === 'paid')
    .slice(0, 12)
    .map(inv => {
      const comp = companiesMap.get(inv.company_id);
      const calcTotal = getInvoiceCalculatedTotal(inv);
      const invoiceGst = Math.round(calcTotal * (18 / 118));
      const invoiceBase = calcTotal - invoiceGst;
      const invoiceTds = Math.round(invoiceBase * 0.03);
      const amount = calcTotal - invoiceTds;
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

  const companyBreakdown = Array.from(companyRevenueMap.entries())
    .map(([companyName, d]) => ({
      companyName,
      revenue: d.revenue,
      invoiceCount: d.count
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  let twoCameraSetupCount = 0;
  let threeCameraSetupCount = 0;
  let singleCameraOrOtherCount = 0;

  rawWorkOrders.forEach(order => {
    (order.workItems || []).forEach(item => {
      if (item.workMain === 'Two_Camera_Setup') twoCameraSetupCount++;
      else if (item.workMain === 'Three_Camera_Setup') threeCameraSetupCount++;
      else singleCameraOrOtherCount++;
    });
  });

  return {
    data: {
      success: true,
      data: {
        kpis: {
          totalRevenue,
          totalAmountReceived,
          tdsAndOther: totalTdsAndOther,
          amountYetToPay: totalTdsAndOther,
          totalGst,
          totalRevenueExGst,
          totalDisbursed: totalCombinedExpenses,
          expenseBreakdown: {
            crew: totalCrewWages,
            travel: totalTravelExpense,
            food: totalFoodExpense,
            stay: totalStayExpense,
            gst: totalGst,
            total: totalCombinedExpenses
          },
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
          totalPayoutsCompleted: rawPayouts.length,
          eventBreakdown: {
            twoCameraSetup: twoCameraSetupCount,
            threeCameraSetup: threeCameraSetupCount,
            other: singleCameraOrOtherCount,
            totalCameraDeployments: twoCameraSetupCount + threeCameraSetupCount + singleCameraOrOtherCount
          }
        },
        recentActivity,
        companyBreakdown
      }
    }
  };
};

/**
 * Primary dashboard aggregator.
 * Tries the Express backend endpoint first; if it returns 404 or fails,
 * transparently falls back to direct client-side Supabase aggregation.
 */
export const fetchDashboardSummary = async () => {
  try {
    const res = await API.get('/dashboard/summary');
    return res;
  } catch (err) {
    if (err.response?.status === 404 || !err.response) {
      console.warn('Backend /api/dashboard/summary not reachable, falling back to direct Supabase aggregation.');
      return await fetchDashboardSummaryDirect();
    }
    throw err;
  }
};

/**
 * Update event-level travel, food, and stay expenses for a work order.
 * Calls backend PUT /api/workOrders/:id/expenses with direct Supabase fallback.
 */
export const updateWorkOrderExpenses = async (orderId, expenses) => {
  try {
    const res = await API.put(`/workOrders/${orderId}/expenses`, expenses);
    return res.data;
  } catch (err) {
    console.warn('Backend expenses route unavailable, using direct Supabase update fallback:', err.message);
    const { travel_expense, food_expense, stay_expense } = expenses;
    const travelNum = Number(travel_expense) || 0;
    const foodNum = Number(food_expense) || 0;
    const stayNum = Number(stay_expense) || 0;

    const { data: wo, error: getErr } = await supabase
      .from('workOrders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (getErr) throw getErr;

    let updatedWorkItems = wo?.workItems || [];
    if (Array.isArray(updatedWorkItems) && updatedWorkItems.length > 0) {
      updatedWorkItems = [
        {
          ...updatedWorkItems[0],
          travelExpense: travelNum,
          foodExpense: foodNum,
          stayExpense: stayNum
        },
        ...updatedWorkItems.slice(1)
      ];
    }

    const { data: updatedWo, error: updateErr } = await supabase
      .from('workOrders')
      .update({
        workItems: updatedWorkItems,
        travel_expense: travelNum,
        food_expense: foodNum,
        stay_expense: stayNum
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateErr && updateErr.message && updateErr.message.includes('column')) {
      const fallbackRes = await supabase
        .from('workOrders')
        .update({ workItems: updatedWorkItems })
        .eq('id', orderId)
        .select()
        .single();
      if (fallbackRes.error) throw fallbackRes.error;
      return { success: true, data: fallbackRes.data };
    }

    if (updateErr) throw updateErr;
    return { success: true, data: updatedWo };
  }
};
