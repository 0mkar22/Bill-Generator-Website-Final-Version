const supabase = require('../config/db');

exports.getPayouts = async (req, res) => {
  try {
    const { data: payouts, error } = await supabase
      .from('personnel_payouts')
      .select('*, workOrders(entryNumber, eventDate)')
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
    const { data: payout, error } = await supabase
      .from('personnel_payouts')
      .insert([req.body])
      .select('*, workOrders(entryNumber, eventDate)');

    if (error) {
        console.error("Supabase Insert Error:", error);
        throw error;
    }

    res.status(201).json({ success: true, data: payout[0] });
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
      .select();

    if (error) throw error;
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
