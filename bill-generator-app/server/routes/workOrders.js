const express = require('express');
const {
  getWorkOrders,
  createWorkOrder,
  deleteWorkOrder,
  getWorkOrder,      // Import new function
  updateWorkOrder    // Import new function
} = require('../controllers/workOrders');

const router = express.Router();

router
  .route('/')
  .get(getWorkOrders)
  .post(createWorkOrder);

router
  .route('/:id')
  .get(getWorkOrder)       // Add GET by ID route
  .put(updateWorkOrder)      // Add PUT route
  .delete(deleteWorkOrder);

module.exports = router;