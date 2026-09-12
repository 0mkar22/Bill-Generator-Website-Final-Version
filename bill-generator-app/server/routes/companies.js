const express = require('express');
const { getCompanies, getCompany, createCompany, updateCompany } = require('../controllers/companies');
const { validateCompany } = require('../middleware/validate');

const router = express.Router();

router.route('/')
  .get(getCompanies)
  .post(validateCompany, createCompany);

router.route('/:id')
  .get(getCompany)
  .put(validateCompany, updateCompany);

module.exports = router;
