const supabase = require('../config/db');

const encodeNotesWithStatus = (notes, status) => {
  const clean = String(notes || '').replace(/^\[PENDING\]\s*/i, '');
  return status === 'pending' ? (clean ? `[PENDING] ${clean}` : '[PENDING]') : clean;
};

const normalizePayoutRecord = (p) => {
  if (!p) return p;
  const rawNotes = String(p.notes || '');
  const isPendingFromNotes = /^\[PENDING\]/i.test(rawNotes);
  const status = (p.status === 'pending' || isPendingFromNotes) ? 'pending' : 'paid';
  const cleanNotes = rawNotes.replace(/^\[PENDING\]\s*/i, '');
  return { ...p, status, notes: cleanNotes };
};

exports.getPayouts = async (req, res) => {
  try {
    const { data: payouts, error } = await supabase
      .from('personnel_payouts')
      .select('*, workOrders(entryNumber, eventDate)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({ success: true, data: (payouts || []).map(normalizePayoutRecord) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.createPayout = async (req, res) => {
  try {
    const rawPayload = Array.isArray(req.body) ? req.body : [req.body];

    // Verify foreign key event_id belongs to req.user.id (prevents cross-tenant association)
    const eventIds = [...new Set(rawPayload.map(p => p.event_id).filter(Boolean))];
    if (eventIds.length > 0) {
      const { data: userOrders, error: orderErr } = await supabase
        .from('workOrders')
        .select('id')
        .in('id', eventIds)
        .eq('user_id', req.user.id);

      if (orderErr) throw orderErr;

      const validOrderIds = new Set((userOrders || []).map(o => o.id));
      const hasInvalidEvent = eventIds.some(eid => !validOrderIds.has(eid));
      if (hasInvalidEvent) {
        return res.status(403).json({ 
          success: false, 
          error: 'Unauthorized: One or more work order IDs do not belong to your account.' 
        });
      }
    }

    const payload = rawPayload.map(item => {
      const status = item.status === 'pending' ? 'pending' : 'paid';
      return {
        ...item,
        status,
        payment_date: status === 'pending' ? null : (item.payment_date || null),
        notes: encodeNotesWithStatus(item.notes, status),
        amount_paid: Number(item.amount_paid),
        user_id: req.user.id
      };
    });

    let { data: payout, error } = await supabase
      .from('personnel_payouts')
      .insert(payload)
      .select('*, workOrders(entryNumber, eventDate)');

    if (error && (error.code === 'PGRST204' || (error.message && (error.message.includes('status') || error.message.includes('column'))))) {
      const fallbackPayload = payload.map(({ status, ...rest }) => rest);
      const fallbackRes = await supabase
        .from('personnel_payouts')
        .insert(fallbackPayload)
        .select('*, workOrders(entryNumber, eventDate)');
      payout = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (error) {
        console.error("Supabase Insert Error:", error);
        throw error;
    }

    res.status(201).json({ success: true, data: (payout || []).map(normalizePayoutRecord) });
  } catch (err) {
    console.error("createPayout Error:", err);
    res.status(400).json({ success: false, error: err.message || err.details || err.hint || JSON.stringify(err) });
  }
};

exports.deletePayout = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: payout, error } = await supabase
      .from('personnel_payouts')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select();

    if (error) throw error;

    if (!payout || payout.length === 0) {
      return res.status(404).json({ success: false, error: 'Payout not found or unauthorized' });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.updatePayout = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, ...updateFields } = req.body; // Prevent user_id override

    // If event_id is being updated, verify it belongs to user
    if (updateFields.event_id) {
      const { data: order, error: orderErr } = await supabase
        .from('workOrders')
        .select('id')
        .eq('id', updateFields.event_id)
        .eq('user_id', req.user.id)
        .single();

      if (orderErr || !order) {
        return res.status(403).json({ success: false, error: 'Unauthorized: Work order does not belong to your account.' });
      }
    }

    if (updateFields.amount_paid !== undefined) {
      updateFields.amount_paid = Number(updateFields.amount_paid);
    }

    if (updateFields.status !== undefined) {
      updateFields.status = updateFields.status === 'pending' ? 'pending' : 'paid';
      updateFields.notes = encodeNotesWithStatus(updateFields.notes, updateFields.status);
      if (updateFields.status === 'pending') {
        updateFields.payment_date = null;
      }
    }
    if (updateFields.payment_date === '') {
      updateFields.payment_date = null;
    }

    let { data: payout, error } = await supabase
      .from('personnel_payouts')
      .update(updateFields)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select('*, workOrders(entryNumber, eventDate)');

    if (error && (error.code === 'PGRST204' || (error.message && (error.message.includes('status') || error.message.includes('column'))))) {
      const { status, ...fallbackFields } = updateFields;
      const fallbackRes = await supabase
        .from('personnel_payouts')
        .update(fallbackFields)
        .eq('id', id)
        .eq('user_id', req.user.id)
        .select('*, workOrders(entryNumber, eventDate)');
      payout = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (error) {
        console.error("Supabase Update Error:", error);
        throw error;
    }

    if (!payout || payout.length === 0) {
        return res.status(404).json({ success: false, error: 'Payout not found or unauthorized' });
    }

    res.status(200).json({ success: true, data: normalizePayoutRecord(payout[0]) });
  } catch (err) {
    console.error("updatePayout Error:", err);
    res.status(400).json({ success: false, error: err.message || err.details || JSON.stringify(err) });
  }
};
