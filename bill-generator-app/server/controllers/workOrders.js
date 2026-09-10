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
    const { entryNumber, eventDate, vendor, workItems, company_id } = req.body;
    let formattedWorkItems = workItems;
    if (formattedWorkItems && Array.isArray(formattedWorkItems)) {
        formattedWorkItems = formattedWorkItems.map(item => ({
            ...item,
            personnel: item.personnel || [] 
        }));
    }
    const payload = { entryNumber, eventDate, vendor, workItems: formattedWorkItems, company_id };

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
    const { entryNumber, eventDate, vendor, workItems, company_id } = req.body;
    let formattedWorkItems = workItems;
    if (formattedWorkItems && Array.isArray(formattedWorkItems)) {
        formattedWorkItems = formattedWorkItems.map(item => ({
            ...item,
            personnel: item.personnel || [] 
        }));
    }
    const payload = { entryNumber, eventDate, vendor, workItems: formattedWorkItems, company_id };

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

exports.updateWorkOrderExpenses = async (req, res) => {
  try {
    const { id } = req.params;
    const { travel_expense, food_expense, stay_expense } = req.body;

    const travelNum = Number(travel_expense) || 0;
    const foodNum = Number(food_expense) || 0;
    const stayNum = Number(stay_expense) || 0;

    const { data: currentWo, error: getErr } = await supabase
      .from('workOrders')
      .select('*')
      .eq('id', id)
      .single();

    if (getErr || !currentWo) {
      return res.status(404).json({ success: false, error: 'Work order not found' });
    }

    let updatedWorkItems = currentWo.workItems || [];
    if (Array.isArray(updatedWorkItems) && updatedWorkItems.length > 0) {
      updatedWorkItems = [
        {
          ...updatedWorkItems[0],
          travelExpense: travelNum,
          foodExpense: foodNum,
          stayExpense: stayNum
        },
        ...updatedWorkItems.slice(1)
      ];
    }

    let { data: updatedWo, error } = await supabase
      .from('workOrders')
      .update({
        workItems: updatedWorkItems,
        travel_expense: travelNum,
        food_expense: foodNum,
        stay_expense: stayNum
      })
      .eq('id', id)
      .select()
      .single();

    if (error && error.message && error.message.includes('column')) {
      const fallbackRes = await supabase
        .from('workOrders')
        .update({ workItems: updatedWorkItems })
        .eq('id', id)
        .select()
        .single();
      updatedWo = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (error) throw error;
    res.status(200).json({ success: true, data: updatedWo });
  } catch (err) {
    console.error('updateWorkOrderExpenses error:', err);
    res.status(500).json({ success: false, error: err.message || 'Server Error' });
  }
};