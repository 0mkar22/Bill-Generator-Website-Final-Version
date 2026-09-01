const express = require('express');
const router = express.Router();
const { getPayouts, createPayout, deletePayout, updatePayout } = require('../controllers/personnelPayouts');

router.route('/')
  .get(getPayouts)
  .post(createPayout);

router.route('/:id')
  .put(updatePayout)
  .delete(deletePayout);

module.exports = router;
