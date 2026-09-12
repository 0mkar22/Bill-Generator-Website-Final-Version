const supabase = require('../config/db');

exports.getCompanies = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.getCompany = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Company not found or unauthorized' });
      }
      throw error;
    }
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.createCompany = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      user_id: req.user.id
    };

    const { data, error } = await supabase
      .from('companies')
      .insert([payload])
      .select();

    if (error) throw error;
    res.status(201).json({ success: true, data: data[0] });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.updateCompany = async (req, res) => {
  try {
    const { user_id, ...updateFields } = req.body;

    const { data, error } = await supabase
      .from('companies')
      .update(updateFields)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({ success: false, error: 'Company not found or unauthorized' });
    }

    res.status(200).json({ success: true, data: data[0] });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, error: err.message });
  }
};
