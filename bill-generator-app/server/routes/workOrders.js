const express = require('express');
const {
  getWorkOrders,
  createWorkOrder,
  deleteWorkOrder,
  getWorkOrder,
  updateWorkOrder,
  updateWorkOrderExpenses
} = require('../controllers/workOrders');
const { validateWorkOrder, validateWorkOrderExpenses } = require('../middleware/validate');

const router = express.Router();

router
  .route('/')
  .get(getWorkOrders)
  .post(validateWorkOrder, createWorkOrder);

router
  .route('/:id/expenses')
  .put(validateWorkOrderExpenses, updateWorkOrderExpenses);

router
  .route('/:id')
  .get(getWorkOrder)
  .put(validateWorkOrder, updateWorkOrder)
  .delete(deleteWorkOrder);

module.exports = router;
