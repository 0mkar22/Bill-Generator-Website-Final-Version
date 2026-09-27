import axios from 'axios';
import { supabase } from '../supabase';
import { calculateItemAmount } from '../utils/helpers';

const API = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api',
  timeout: 15000
});

API.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError && session?.access_token) {
          originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
          return API(originalRequest);
        }
      } catch (refreshErr) {
        console.warn('Auto-refresh token failed:', refreshErr);
      }
    }
    return Promise.reject(error);
  }
);

export const createWorkOrder = async (workOrderData) => {
  try {
    return await API.post('/workOrders', workOrderData);
  } catch (err) {
    console.warn('Backend /workOrders create unavailable, using direct Supabase fallback:', err.message);
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    const payload = { ...workOrderData };
    if (userId && !payload.user_id) payload.user_id = userId;
    const { data, error } = await supabase.from('workOrders').insert([payload]).select().single();
    if (error) throw error;
    return { data: { success: true, data } };
  }
};

export const updateWorkOrder = async (id, workOrderData) => {
  try {
    return await API.put(`/workOrders/${id}`, workOrderData);
  } catch (err) {
    console.warn('Backend /workOrders update unavailable, using direct Supabase fallback:', err.message);
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    const { user_id, ...updateFields } = workOrderData;
    let query = supabase.from('workOrders').update(updateFields).eq('id', id);
    if (userId) query = query.eq('user_id', userId);
    const { data: updated, error } = await query.select().single();
    if (error) throw error;
    return { data: { success: true, data: updated } };
  }
};

export const getWorkOrders = async () => {
  try {
    return await API.get('/workOrders');
  } catch (err) {
    console.warn('Backend /workOrders unavailable, using direct Supabase fallback:', err.message);
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    let query = supabase.from('workOrders').select('*').order('eventDate', { ascending: false });
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;
    if (error) throw error;
    return { data: { success: true, data: data || [] } };
  }
};

export const getCompanies = async () => {
  try {
    return await API.get('/companies');
  } catch (err) {
    console.warn('Backend /companies unavailable, using direct Supabase fallback:', err.message);
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    let query = supabase.from('companies').select('*').order('created_at', { ascending: false });
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;
    if (error) throw error;
    return { data: { success: true, data: data || [] } };
  }
};

export const getCompanyById = async (id) => {
  try {
    return await API.get(`/companies/${id}`);
  } catch (err) {
    console.warn(`Backend /companies/${id} unavailable, using direct Supabase fallback:`, err.message);
    const { data, error } = await supabase.from('companies').select('*').eq('id', id).single();
    if (error) throw error;
    return { data: { success: true, data } };
  }
};

export const createCompany = async (data) => {
  try {
    return await API.post('/companies', data);
  } catch (err) {
    console.warn('Backend /companies create unavailable, using direct Supabase fallback:', err.message);
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    const payload = { ...data };
    if (userId && !payload.user_id) payload.user_id = userId;
    const { data: inserted, error } = await supabase.from('companies').insert([payload]).select().single();
    if (error) throw error;
    return { data: { success: true, data: inserted } };
  }
};

export const updateCompany = async (id, data) => {
  try {
    return await API.put(`/companies/${id}`, data);
  } catch (err) {
    console.warn('Backend /companies update unavailable, using direct Supabase fallback:', err.message);
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    const { user_id, ...updateFields } = data;
    let query = supabase.from('companies').update(updateFields).eq('id', id);
    if (userId) query = query.eq('user_id', userId);
    const { data: updated, error } = await query.select().single();
    if (error) throw error;
    return { data: { success: true, data: updated } };
  }
};

export const getTeam = async () => {
  try {
    return await API.get('/team');
  } catch (err) {
    console.warn('Backend /team unavailable, using direct Supabase fallback:', err.message);
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    let query = supabase.from('team').select('*').order('name', { ascending: true });
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;
    if (error) throw error;
    return { data: { success: true, data: data || [] } };
  }
};

export const upsertTeam = async (data) => {
  try {
    return await API.post('/team', data);
  } catch (err) {
    console.warn('Backend /team upsert unavailable, using direct Supabase fallback:', err.message);
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    const payload = { ...data };
    if (userId && !payload.user_id) payload.user_id = userId;
    const { data: upserted, error } = await supabase
      .from('team')
      .upsert([payload], { onConflict: 'user_id, name' })
      .select()
      .single();
    if (error) throw error;
    return { data: { success: true, data: upserted } };
  }
};

export const getInvoices = async () => {
  try {
    return await API.get('/invoices');
  } catch (err) {
    console.warn('Backend /invoices unavailable, using direct Supabase fallback:', err.message);
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    let query = supabase.from('invoices').select('*').order('createdAt', { ascending: false });
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;
    if (error) throw error;
    return { data: { success: true, data: data || [] } };
  }
};

export default API;

export const updateInvoiceStatus = async (id, status) => {
  try {
    return await API.patch(`/invoices/${id}/status`, { status });
  } catch (err) {
    console.warn('Backend updateInvoiceStatus unavailable, using direct Supabase fallback:', err.message);
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    let query = supabase.from('invoices').update({ status }).eq('id', id);
    if (userId) query = query.eq('user_id', userId);
    const { data: updated, error } = await query.select().single();
    if (error) throw error;
    return { data: { success: true, data: updated } };
  }
};

export const getPayouts = async () => {
  try {
    return await API.get('/personnelPayouts');
  } catch (err) {
    console.warn('Backend /personnelPayouts unavailable, using direct Supabase fallback:', err.message);
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    let query = supabase
      .from('personnel_payouts')
      .select('*, workOrders(entryNumber, eventDate)')
      .order('created_at', { ascending: false });
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;
    if (error) throw error;
    return { data: { success: true, data: data || [] } };
  }
};

export const createPayout = async (data) => {
  try {
    return await API.post('/personnelPayouts', data);
  } catch (err) {
    console.warn('Backend /personnelPayouts create unavailable, using direct Supabase fallback:', err.message);
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    const payload = Array.isArray(data)
      ? data.map(p => ({ ...p, user_id: userId }))
      : { ...data, user_id: userId };
    const { data: inserted, error } = await supabase
      .from('personnel_payouts')
      .insert(Array.isArray(payload) ? payload : [payload])
      .select();
    if (error) throw error;
    return { data: { success: true, data: inserted } };
  }
};

export const deletePayout = async (id) => {
  try {
    return await API.delete(`/personnelPayouts/${id}`);
  } catch (err) {
    console.warn('Backend /personnelPayouts delete unavailable, using direct Supabase fallback:', err.message);
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    let query = supabase.from('personnel_payouts').delete().eq('id', id);
    if (userId) query = query.eq('user_id', userId);
    const { error } = await query;
    if (error) throw error;
    return { data: { success: true } };
  }
};

export const updatePayout = async (id, data) => {
  try {
    return await API.put(`/personnelPayouts/${id}`, data);
  } catch (err) {
    console.warn('Backend /personnelPayouts update unavailable, using direct Supabase fallback:', err.message);
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    const { user_id, ...updateFields } = data;
    let query = supabase.from('personnel_payouts').update(updateFields).eq('id', id);
    if (userId) query = query.eq('user_id', userId);
    const { data: updated, error } = await query.select().single();
    if (error) throw error;
    return { data: { success: true, data: updated } };
  }
};

export const updateInvoiceAmountReceived = async (id, amount_received) => {
  try {
    return await API.patch(`/invoices/${id}/amount-received`, { amount_received });
  } catch (err) {
    console.warn('Backend updateInvoiceAmountReceived unavailable, using direct Supabase fallback:', err.message);
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    let query = supabase.from('invoices').update({ amount_received }).eq('id', id);
    if (userId) query = query.eq('user_id', userId);
    const { data: updated, error } = await query.select().single();
    if (error) throw error;
    return { data: { success: true, data: updated } };
  }
};

/**
 * Direct client-side Supabase aggregation fallback.
 * Ensures the dashboard always renders live data with zero downtime
 * even if the Express container is rebuilding or temporarily unavailable.
 */
export const fetchDashboardSummaryDirect = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;

  let invoicesQuery = supabase.from('invoices').select('*').order('createdAt', { ascending: false });
  let payoutsQuery = supabase.from('personnel_payouts').select('*, workOrders(entryNumber, eventDate)').order('created_at', { ascending: false });
  let workOrdersQuery = supabase.from('workOrders').select('*').order('eventDate', { ascending: false });
  let companiesQuery = supabase.from('companies').select('*');

  if (userId) {
    invoicesQuery = invoicesQuery.eq('user_id', userId);
    payoutsQuery = payoutsQuery.eq('user_id', userId);
    workOrdersQuery = workOrdersQuery.eq('user_id', userId);
    companiesQuery = companiesQuery.eq('user_id', userId);
  }

  const [invoicesRes, payoutsRes, workOrdersRes, companiesRes] = await Promise.all([
    invoicesQuery,
    payoutsQuery,
    workOrdersQuery,
    companiesQuery
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

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    let getQuery = supabase
      .from('workOrders')
      .select('*')
      .eq('id', orderId);
    if (userId) getQuery = getQuery.eq('user_id', userId);

    const { data: wo, error: getErr } = await getQuery.single();

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

    let updateQuery = supabase
      .from('workOrders')
      .update({
        workItems: updatedWorkItems,
        travel_expense: travelNum,
        food_expense: foodNum,
        stay_expense: stayNum
      })
      .eq('id', orderId);
    if (userId) updateQuery = updateQuery.eq('user_id', userId);

    let { data: updatedWo, error: updateErr } = await updateQuery
      .select()
      .single();

    if (updateErr && updateErr.message && updateErr.message.includes('column')) {
      let fallbackQuery = supabase
        .from('workOrders')
        .update({ workItems: updatedWorkItems })
        .eq('id', orderId);
      if (userId) fallbackQuery = fallbackQuery.eq('user_id', userId);

      const fallbackRes = await fallbackQuery
        .select()
        .single();
      if (fallbackRes.error) throw fallbackRes.error;
      return { success: true, data: fallbackRes.data };
    }

    if (updateErr) throw updateErr;
    return { success: true, data: updatedWo };
  }
};
