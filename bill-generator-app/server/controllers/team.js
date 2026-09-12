const supabase = require('../config/db');

exports.getTeam = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('team')
      .select('*')
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.upsertTeam = async (req, res) => {
  try {
    const rawData = Array.isArray(req.body) ? req.body : [req.body];
    const payload = rawData.map(item => ({
      ...item,
      user_id: req.user.id
    }));

    const { data, error } = await supabase
      .from('team')
      .upsert(payload, { onConflict: 'user_id,name' })
      .select();

    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, error: err.message });
  }
};
