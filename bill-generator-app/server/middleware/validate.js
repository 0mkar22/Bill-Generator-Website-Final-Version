const validateWorkOrder = (req, res, next) => {
  const { entryNumber, eventDate, vendor, workItems } = req.body;
  const errors = [];

  if (!entryNumber) errors.push('Entry number is required');
  if (!eventDate) errors.push('Event date is required');
  if (!vendor) errors.push('Vendor is required');

  const validVendors = ['ICOMP SYSTEMS', 'STUDIO VISION', 'WAGHSONS PHOTO VISION'];
  if (vendor && !validVendors.includes(vendor)) {
    errors.push('Invalid vendor');
  }

  if (!workItems || !Array.isArray(workItems) || workItems.length === 0) {
    errors.push('At least one work item is required');
  } else {
    workItems.forEach((item, idx) => {
      if (!item.eventName) errors.push(`Work item ${idx + 1}: Event name is required`);
      if (!item.poNpo) errors.push(`Work item ${idx + 1}: PO/NPO is required`);
      if (!item.workMain) errors.push(`Work item ${idx + 1}: Work type is required`);
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: errors });
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
    errors.push('At least one work item ID is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: errors });
  }

  next();
};

module.exports = { validateWorkOrder, validateInvoice };
