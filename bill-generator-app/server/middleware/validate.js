const validateWorkOrder = (req, res, next) => {
  const { entryNumber, eventDate, vendor, workItems } = req.body;
  const errors = [];

  if (!entryNumber) errors.push('Entry number is required');
  if (!eventDate) errors.push('Event date is required');
  if (!vendor || typeof vendor !== 'string' || vendor.trim() === '') errors.push('Vendor is required');

  if (!workItems || !Array.isArray(workItems) || workItems.length === 0) {
    errors.push('At least one work item is required');
  } else {
    workItems.forEach((item, idx) => {
      if (!item.eventName || typeof item.eventName !== 'string' || item.eventName.trim() === '') {
        errors.push(`Work item ${idx + 1}: Event name is required`);
      }
      if (!item.workMain) errors.push(`Work item ${idx + 1}: Work type is required`);
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: errors.join('; ') });
  }

  next();
};

const validateInvoice = (req, res, next) => {
  const { invoiceType, workItems } = req.body;
  const errors = [];

  if (!invoiceType || !['Vendor', 'WorkOrder'].includes(invoiceType)) {
    errors.push('Invoice type must be either "Vendor" or "WorkOrder"');
  }

  if (!workItems || !Array.isArray(workItems) || workItems.length === 0) {
    errors.push('At least one work item reference is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: errors.join('; ') });
  }

  next();
};

const validateInvoiceStatus = (req, res, next) => {
  const { status } = req.body;
  const allowed = ['saved', 'paid', 'pending', 'cancelled'];
  if (!status || !allowed.includes(status)) {
    return res.status(400).json({ 
      success: false, 
      error: `Invalid status. Must be one of: ${allowed.join(', ')}` 
    });
  }
  next();
};

const validateInvoiceAmountReceived = (req, res, next) => {
  const { amount_received } = req.body;
  if (amount_received === undefined || amount_received === null || amount_received === '') {
    return res.status(400).json({ success: false, error: 'Amount received is required.' });
  }
  const num = Number(amount_received);
  if (isNaN(num) || !isFinite(num) || num < 0) {
    return res.status(400).json({ success: false, error: 'Amount received must be a valid non-negative number.' });
  }
  req.body.amount_received = num;
  next();
};

const validatePayoutPayload = (req, res, next) => {
  const raw = Array.isArray(req.body) ? req.body : [req.body];
  if (raw.length === 0) {
    return res.status(400).json({ success: false, error: 'Payout payload cannot be empty.' });
  }

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!item.personnel_name || typeof item.personnel_name !== 'string' || !item.personnel_name.trim()) {
      return res.status(400).json({ success: false, error: `Item ${i + 1}: Personnel name is required.` });
    }
    const amt = Number(item.amount_paid);
    if (isNaN(amt) || !isFinite(amt) || amt <= 0) {
      return res.status(400).json({ success: false, error: `Item ${i + 1}: Amount paid must be a valid number greater than 0.` });
    }
  }
  next();
};

const validateWorkOrderExpenses = (req, res, next) => {
  const { travel_expense, food_expense, stay_expense } = req.body;
  const expenseKeys = { travel_expense, food_expense, stay_expense };

  for (const [k, v] of Object.entries(expenseKeys)) {
    if (v !== undefined && v !== null && v !== '') {
      const num = Number(v);
      if (isNaN(num) || !isFinite(num) || num < 0) {
        return res.status(400).json({ success: false, error: `${k} must be a valid non-negative number.` });
      }
    }
  }
  next();
};

const validateCompany = (req, res, next) => {
  const { company_name } = req.body;
  if (!company_name || typeof company_name !== 'string' || !company_name.trim()) {
    return res.status(400).json({ success: false, error: 'Company name is required.' });
  }
  next();
};

module.exports = {
  validateWorkOrder,
  validateInvoice,
  validateInvoiceStatus,
  validateInvoiceAmountReceived,
  validatePayoutPayload,
  validateWorkOrderExpenses,
  validateCompany
};
