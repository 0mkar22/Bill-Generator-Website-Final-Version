const express = require('express');
const { getCompanies, getCompany, createCompany, updateCompany } = require('../controllers/companies');

const router = express.Router();

router.route('/')
  .get(getCompanies)
  .post(createCompany);

router.route('/:id')
  .get(getCompany)
  .put(updateCompany);

module.exports = router;
