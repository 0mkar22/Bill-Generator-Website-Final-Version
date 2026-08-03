const supabase = require('../config/db');

exports.getInvoices = async (req, res) => {
  try {
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;

    res.status(200).json({ success: true, data: invoices });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.createInvoice = async (req, res) => {
  try {
    let invoiceNumberToSave = req.body.invoiceNumber;

    if (!invoiceNumberToSave) {
        const { data: lastInvoices, error: fetchError } = await supabase
            .from('invoices')
            .select('invoiceNumber')
            .order('createdAt', { ascending: false })
            .limit(1);

        if (fetchError) throw fetchError;

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

    const { invoiceNumber, invoiceType, workItems, parentOrderInfo, recipient, dealingOfficer, emailId, vendorCode, poNumber, poDate, serviceDescription } = req.body;

    const invoiceData = {
        invoiceType,
        workItems,
        parentOrderInfo,
        recipient,
        dealingOfficer,
        emailId,
        vendorCode,
        poNumber,
        poDate,
        serviceDescription
    };

    const { data: invoice, error: insertError } = await supabase
        .from('invoices')
        .insert([{
            ...invoiceData,
            invoiceNumber: invoiceNumberToSave
        }])
        .select();

    if (insertError) throw insertError;

    res.status(201).json({ success: true, data: invoice[0] });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { invoiceNumber, invoiceType, workItems, parentOrderInfo, recipient, dealingOfficer, emailId, vendorCode, poNumber, poDate, serviceDescription } = req.body;

    const invoiceData = {
        invoiceNumber,
        invoiceType,
        workItems,
        parentOrderInfo,
        recipient,
        dealingOfficer,
        emailId,
        vendorCode,
        poNumber,
        poDate,
        serviceDescription
    };

    const { data: invoice, error: updateError } = await supabase
        .from('invoices')
        .update(invoiceData)
        .eq('id', id)
        .select();

    if (updateError) throw updateError;

    if (!invoice || invoice.length === 0) {
        return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    res.status(200).json({ success: true, data: invoice[0] });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, error: err.message });
  }
};
