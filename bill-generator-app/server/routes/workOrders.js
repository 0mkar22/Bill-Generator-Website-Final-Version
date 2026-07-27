const express = require('express');
const {
  getWorkOrders,
  createWorkOrder,
  deleteWorkOrder,
  getWorkOrder,
  updateWorkOrder
} = require('../controllers/workOrders');
const { validateWorkOrder } = require('../middleware/validate');

const router = express.Router();

router
  .route('/')
  .get(getWorkOrders)
  .post(validateWorkOrder, createWorkOrder);

router
  .route('/:id')
  .get(getWorkOrder)
  .put(validateWorkOrder, updateWorkOrder)
  .delete(deleteWorkOrder);

module.exports = router;
