const WorkOrder = require('../models/WorkOrder');

// @desc    Get all work orders
exports.getWorkOrders = async (req, res, next) => {
  try {
    const workOrders = await WorkOrder.find();
    res.status(200).json({ success: true, count: workOrders.length, data: workOrders });
    console.log('--- WORK ORDER CREATED ---');
  } 
  catch (err) {
    console.error(err); // Log the error
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Create new work order
exports.createWorkOrder = async (req, res, next) => {
  try {
    const workOrder = await WorkOrder.create(req.body);
    res.status(201).json({
      success: true,
      data: workOrder
    });
    console.log('--- WORK ORDER CREATED ---');
  } catch (err) {
    // --- THIS IS THE UPGRADED PART ---
    console.error('--- CREATE WORK ORDER FAILED ---');
    console.error(err); // Log the full error to the server console

    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({ success: false, error: messages });
    } else {
        // For any other type of error, respond with a 500
        return res.status(500).json({ success: false, error: 'Server Error' });
    }
  }
};

// @desc    Get single work order
exports.getWorkOrder = async (req, res, next) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id);
    if (!workOrder) {
      return res.status(404).json({ success: false });
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
    let workOrder = await WorkOrder.findById(req.params.id);
    if (!workOrder) {
      return res.status(404).json({ success: false });
    }
    workOrder = await WorkOrder.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    res.status(200).json(workOrder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Delete work order
exports.deleteWorkOrder = async (req, res, next) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id);
    if (!workOrder) {
      return res.status(404).json({ success: false, error: 'No work order found' });
    }
    await workOrder.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};