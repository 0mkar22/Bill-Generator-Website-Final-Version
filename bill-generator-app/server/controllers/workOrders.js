const supabase = require('../config/db');

exports.getWorkOrders = async (req, res) => {
  try {
    const { data: workOrders, error } = await supabase
      .from('workOrders')
      .select('*');

    if (error) throw error;

    res.status(200).json({ success: true, count: workOrders.length, data: workOrders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.createWorkOrder = async (req, res) => {
  try {
    // Explicitly formatting the payload to ensure the nested personnel array is preserved
    const payload = { ...req.body };
    if (payload.workItems && Array.isArray(payload.workItems)) {
        payload.workItems = payload.workItems.map(item => ({
            ...item,
            personnel: item.personnel || [] 
        }));
    }

    const { data: workOrder, error } = await supabase
      .from('workOrders')
      .insert([payload])
      .select();

    if (error) throw error;

    res.status(201).json({ success: true, data: workOrder[0] });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ success: false, error: err.message });
  }
};

exports.getWorkOrder = async (req, res) => {
  try {
    const { data: workOrder, error } = await supabase
      .from('workOrders')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
        if (error.code === 'PGRST116') {
            return res.status(404).json({ success: false, error: 'No work order found' });
        }
        throw error;
    }

    res.status(200).json({ success: true, data: workOrder });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.updateWorkOrder = async (req, res) => {
  try {
    // Explicitly formatting the payload for updates as well
    const payload = { ...req.body };
    if (payload.workItems && Array.isArray(payload.workItems)) {
        payload.workItems = payload.workItems.map(item => ({
            ...item,
            personnel: item.personnel || [] 
        }));
    }

    const { data: workOrder, error } = await supabase
      .from('workOrders')
      .update(payload)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
        if (error.code === 'PGRST116') {
            return res.status(404).json({ success: false, error: 'No work order found' });
        }
        throw error;
    }

    res.status(200).json({ success: true, data: workOrder });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.deleteWorkOrder = async (req, res) => {
  try {
    const { data: workOrder, error } = await supabase
      .from('workOrders')
      .delete()
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
        if (error.code === 'PGRST116') {
            return res.status(404).json({ success: false, error: 'No work order found' });
        }
        throw error;
    }

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};