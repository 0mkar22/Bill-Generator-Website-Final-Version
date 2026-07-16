const supabase = require('../config/db');

// @desc    Get all saved invoices
exports.getInvoices = async (req, res, next) => {
  try {
    // Supabase returns { data, error } instead of throwing by default
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .order('createdAt', { ascending: false }); 
      // Note: If you used Postgres's default 'created_at', update the string above accordingly.

    if (error) {
        throw error;
    }

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
        // Fetch the most recent invoice to get the last invoiceNumber
        const { data: lastInvoices, error: fetchError } = await supabase
            .from('invoices')
            .select('invoiceNumber')
            .order('createdAt', { ascending: false })
            .limit(1);

        if (fetchError) {
            throw fetchError;
        }

        const lastInvoice = lastInvoices && lastInvoices.length > 0 ? lastInvoices[0] : null;
        let newInvoiceNumber = 1;

        if (lastInvoice && lastInvoice.invoiceNumber) {
            const lastNum = parseInt(lastInvoice.invoiceNumber.replace(/[^0-9]/g, ''), 10);
            if (!isNaN(lastNum)) {
                newInvoiceNumber = lastNum + 1;
            }
        }
        invoiceNumberToSave = String(newInvoiceNumber).padStart(4, '0');
    }

    // Insert the new invoice
    const { data: invoice, error: insertError } = await supabase
        .from('invoices')
        .insert([{ 
            ...req.body, 
            invoiceNumber: invoiceNumberToSave 
        }])
        .select(); // .select() ensures the inserted row is returned

    if (insertError) {
        throw insertError;
    }

    // Supabase insert with .select() returns an array, so we return the first item
    res.status(201).json({ success: true, data: invoice[0] });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, error: err.message });
  }
};