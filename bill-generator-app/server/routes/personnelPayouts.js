const express = require('express');
const router = express.Router();
const { getPayouts, createPayout, deletePayout } = require('../controllers/personnelPayouts');

router.route('/')
  .get(getPayouts)
  .post(createPayout);

router.route('/:id')
  .delete(deletePayout);

module.exports = router;
