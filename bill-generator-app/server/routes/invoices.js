const express = require('express');
const { getInvoices, createInvoice, updateInvoice, updateInvoiceStatus, updateInvoiceAmountReceived } = require('../controllers/invoices');
const { validateInvoice } = require('../middleware/validate');

const router = express.Router();

router
  .route('/')
  .get(getInvoices)
  .post(validateInvoice, createInvoice);

router
  .route('/:id')
  .put(validateInvoice, updateInvoice);

module.exports = router;

router.patch('/:id/status', updateInvoiceStatus);
router.route('/:id/amount-received').patch(updateInvoiceAmountReceived);
