const supabase = require('../config/db');

exports.getPayouts = async (req, res) => {
  try {
    const { data: payouts, error } = await supabase
      .from('personnel_payouts')
      .select('*, workOrders(entryNumber, eventDate)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({ success: true, data: payouts });
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

    const payload = rawPayload.map(item => ({
      ...item,
      amount_paid: Number(item.amount_paid),
      user_id: req.user.id
    }));

    const { data: payout, error } = await supabase
      .from('personnel_payouts')
      .insert(payload)
      .select('*, workOrders(entryNumber, eventDate)');

    if (error) {
        console.error("Supabase Insert Error:", error);
        throw error;
    }

    res.status(201).json({ success: true, data: payout });
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

    const { data: payout, error } = await supabase
      .from('personnel_payouts')
      .update(updateFields)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select('*, workOrders(entryNumber, eventDate)');

    if (error) {
        console.error("Supabase Update Error:", error);
        throw error;
    }

    if (!payout || payout.length === 0) {
        return res.status(404).json({ success: false, error: 'Payout not found or unauthorized' });
    }

    res.status(200).json({ success: true, data: payout[0] });
  } catch (err) {
    console.error("updatePayout Error:", err);
    res.status(400).json({ success: false, error: err.message || err.details || JSON.stringify(err) });
  }
};
