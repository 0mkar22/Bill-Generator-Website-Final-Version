const express = require('express');
const { getInvoices, createInvoice } = require('../controllers/invoices');
const router = express.Router();

router
  .route('/')
  .get(getInvoices)
  .post(createInvoice);

module.exports = router;