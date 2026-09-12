const supabase = require('../config/db');

exports.getInvoices = async (req, res) => {
  try {
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', req.user.id)
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
        const { data: existingInvoices, error: fetchError } = await supabase
            .from('invoices')
            .select('invoiceNumber')
            .eq('user_id', req.user.id);

        if (fetchError) throw fetchError;

        let maxNum = 0;
        (existingInvoices || []).forEach(inv => {
          if (inv.invoiceNumber) {
            const parsed = parseInt(inv.invoiceNumber.replace(/[^0-9]/g, ''), 10);
            if (!isNaN(parsed) && parsed > maxNum) {
              maxNum = parsed;
            }
          }
        });
        invoiceNumberToSave = String(maxNum + 1).padStart(4, '0');
    }

    const { invoiceType, workItems, parentOrderInfo, recipient, dealingOfficer, emailId, vendorCode, poNumber, poDate, serviceDescription, gstNo, company_id, company_address } = req.body;

    if (company_id) {
      const { data: comp, error: compErr } = await supabase
        .from('companies')
        .select('id')
        .eq('id', company_id)
        .eq('user_id', req.user.id)
        .single();

      if (compErr || !comp) {
        return res.status(403).json({ success: false, error: 'Unauthorized: Company does not belong to your account.' });
      }
    }

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
        serviceDescription,
        gstno: gstNo,
        company_id,
        company_address,
        user_id: req.user.id
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
    const { invoiceNumber, invoiceType, workItems, parentOrderInfo, recipient, dealingOfficer, emailId, vendorCode, poNumber, poDate, serviceDescription, gstNo, company_id, company_address } = req.body;

    if (company_id) {
      const { data: comp, error: compErr } = await supabase
        .from('companies')
        .select('id')
        .eq('id', company_id)
        .eq('user_id', req.user.id)
        .single();

      if (compErr || !comp) {
        return res.status(403).json({ success: false, error: 'Unauthorized: Company does not belong to your account.' });
      }
    }

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
        serviceDescription,
        gstno: gstNo,
        company_id,
        company_address
    };

    const { data: invoice, error: updateError } = await supabase
        .from('invoices')
        .update(invoiceData)
        .eq('id', id)
        .eq('user_id', req.user.id)
        .select();

    if (updateError) throw updateError;

    if (!invoice || invoice.length === 0) {
        return res.status(404).json({ success: false, error: 'Invoice not found or unauthorized' });
    }

    res.status(200).json({ success: true, data: invoice[0] });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data: currentInvoice, error: fetchErr } = await supabase
        .from('invoices')
        .select('id, invoiceNumber, company_id, parentOrderInfo, workItems')
        .eq('id', id)
        .eq('user_id', req.user.id)
        .single();

    if (fetchErr || !currentInvoice) {
        return res.status(404).json({ success: false, error: 'Invoice not found or unauthorized.' });
    }

    // Enforce ONGC Single-Paid-Invoice Rule
    if (status === 'paid' && currentInvoice.company_id) {
      const { data: comp } = await supabase
        .from('companies')
        .select('company_name, requires_po_number')
        .eq('id', currentInvoice.company_id)
        .eq('user_id', req.user.id)
        .single();

      const compName = comp?.company_name?.toUpperCase() || '';
      const isONGC = comp?.requires_po_number || compName.includes('ONGC') || compName.includes('OIL & NATURAL GAS');

      if (isONGC) {
        const entryNum = currentInvoice.parentOrderInfo?.entryNumber;
        if (entryNum) {
          const { data: paidInvoices, error: paidErr } = await supabase
            .from('invoices')
            .select('id, invoiceNumber, parentOrderInfo, workItems')
            .eq('user_id', req.user.id)
            .eq('status', 'paid');

          if (paidErr) throw paidErr;

          const hasConflict = (paidInvoices || []).some(inv => {
            if (inv.invoiceNumber === currentInvoice.invoiceNumber) return false;
            if (inv.parentOrderInfo?.entryNumber && String(inv.parentOrderInfo.entryNumber) === String(entryNum)) {
              return true;
            }
            let invItems = [];
            try {
              invItems = Array.isArray(inv.workItems) ? inv.workItems : JSON.parse(inv.workItems || '[]');
            } catch(e) {}
            return invItems.some(itemId => typeof itemId === 'string' && itemId.startsWith(`entry-${entryNum}-`));
          });

          if (hasConflict) {
            return res.status(409).json({ 
              success: false, 
              error: 'Conflict: An invoice for this ONGC work order has already been marked as paid.' 
            });
          }
        }
      }
    }

    // Atomically synchronize all twin invoices sharing this invoiceNumber for the tenant
    const { data: invoice, error: updateError } = await supabase
        .from('invoices')
        .update({ status })
        .eq('invoiceNumber', currentInvoice.invoiceNumber)
        .eq('user_id', req.user.id)
        .select();

    if (updateError) throw updateError;
    res.status(200).json({ success: true, data: invoice });
  } catch (err) {
    console.error("Update Invoice Status Error:", err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.updateInvoiceAmountReceived = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount_received } = req.body;
    const sanitizedAmount = Math.max(0, Number(amount_received) || 0);

    const { data: currentInvoice, error: fetchErr } = await supabase
        .from('invoices')
        .select('id, invoiceNumber')
        .eq('id', id)
        .eq('user_id', req.user.id)
        .single();

    if (fetchErr || !currentInvoice) {
        return res.status(404).json({ success: false, error: 'Invoice not found or unauthorized.' });
    }

    const { data: invoice, error: updateError } = await supabase
        .from('invoices')
        .update({ amount_received: sanitizedAmount })
        .eq('id', currentInvoice.id)
        .eq('user_id', req.user.id)
        .select();

    if (updateError) throw updateError;
    res.status(200).json({ success: true, data: invoice });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
