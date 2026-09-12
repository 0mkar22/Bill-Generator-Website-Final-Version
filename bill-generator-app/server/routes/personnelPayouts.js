const express = require('express');
const router = express.Router();
const { getPayouts, createPayout, deletePayout, updatePayout } = require('../controllers/personnelPayouts');
const { validatePayoutPayload } = require('../middleware/validate');

router.route('/')
  .get(getPayouts)
  .post(validatePayoutPayload, createPayout);

router.route('/:id')
  .put(validatePayoutPayload, updatePayout)
  .delete(deletePayout);

module.exports = router;
