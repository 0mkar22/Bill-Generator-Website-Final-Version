const express = require('express');
const { getInvoices, createInvoice, updateInvoice, updateInvoiceStatus, updateInvoiceAmountReceived } = require('../controllers/invoices');
const { validateInvoice, validateInvoiceStatus, validateInvoiceAmountReceived } = require('../middleware/validate');

const router = express.Router();

router
  .route('/')
  .get(getInvoices)
  .post(validateInvoice, createInvoice);

router
  .route('/:id')
  .put(validateInvoice, updateInvoice);

router.patch('/:id/status', validateInvoiceStatus, updateInvoiceStatus);
router.patch('/:id/amount-received', validateInvoiceAmountReceived, updateInvoiceAmountReceived);

module.exports = router;
