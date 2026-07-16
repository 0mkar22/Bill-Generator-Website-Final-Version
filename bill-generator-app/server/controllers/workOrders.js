const supabase = require('../config/db');

// @desc    Get all work orders
exports.getWorkOrders = async (req, res, next) => {
  try {
    const { data: workOrders, error } = await supabase
      .from('workOrders') // Ensure your table name matches this in Supabase exactly
      .select('*');

    if (error) throw error;

    res.status(200).json({ success: true, count: workOrders.length, data: workOrders });
    console.log('--- WORK ORDERS FETCHED ---');
  } catch (err) {
    console.error(err); 
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Create new work order
exports.createWorkOrder = async (req, res, next) => {
  try {
    const { data: workOrder, error } = await supabase
      .from('workOrders')
      .insert([req.body])
      .select(); // .select() ensures the newly inserted row is returned

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: workOrder[0] // Supabase insert with .select() returns an array
    });
    console.log('--- WORK ORDER CREATED ---');
  } catch (err) {
    console.error('--- CREATE WORK ORDER FAILED ---');
    console.error(err); 
    
    // Pass the Supabase database error message back to the client
    return res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Get single work order
exports.getWorkOrder = async (req, res, next) => {
  try {
    const { data: workOrder, error } = await supabase
      .from('workOrders')
      .select('*')
      .eq('id', req.params.id) 
      .single(); // .single() returns an object instead of an array

    if (error) {
        // PGRST116 is the PostgREST error code for "Results contain 0 rows"
        if (error.code === 'PGRST116') {
            return res.status(404).json({ success: false, error: 'No work order found' });
        }
        throw error;
    }

    res.status(200).json(workOrder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Update work order
exports.updateWorkOrder = async (req, res, next) => {
  try {
    const { data: workOrder, error } = await supabase
      .from('workOrders')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
        if (error.code === 'PGRST116') {
            return res.status(404).json({ success: false, error: 'No work order found' });
        }
        throw error;
    }

    res.status(200).json(workOrder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Delete work order
exports.deleteWorkOrder = async (req, res, next) => {
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