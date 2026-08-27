const supabase = require('../config/db');

exports.getTeam = async (req, res) => {
  try {
    const { data, error } = await supabase.from('team').select('*');
    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.upsertTeam = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('team')
      .upsert(req.body, { onConflict: 'name' })
      .select();
    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, error: err.message });
  }
};
