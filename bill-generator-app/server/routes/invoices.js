const express = require('express');
const { getInvoices, createInvoice } = require('../controllers/invoices');
const { validateInvoice } = require('../middleware/validate');

const router = express.Router();

router
  .route('/')
  .get(getInvoices)
  .post(validateInvoice, createInvoice);

module.exports = router;
