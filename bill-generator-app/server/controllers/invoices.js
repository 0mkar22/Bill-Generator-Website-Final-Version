const Invoice = require('../models/Invoice');

// @desc    Get all saved invoices
exports.getInvoices = async (req, res, next) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: invoices });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Save a new invoice
exports.createInvoice = async (req, res, next) => {
  try {
    let invoiceNumberToSave = req.body.invoiceNumber;

    // If no invoice number is provided by the client, generate a new one
    if (!invoiceNumberToSave) {
        const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });
        let newInvoiceNumber = 1;
        if (lastInvoice && lastInvoice.invoiceNumber) {
            const lastNum = parseInt(lastInvoice.invoiceNumber.replace(/[^0-9]/g, ''), 10);
            if (!isNaN(lastNum)) {
                newInvoiceNumber = lastNum + 1;
            }
        }
        invoiceNumberToSave = String(newInvoiceNumber).padStart(4, '0');
    }

    const invoice = await Invoice.create({
        ...req.body,
        invoiceNumber: invoiceNumberToSave 
    });
    res.status(201).json({ success: true, data: invoice });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, error: err.message });
  }
};