const express = require('express');
const { getTeam, upsertTeam } = require('../controllers/team');

const router = express.Router();

router.route('/')
  .get(getTeam)
  .post(upsertTeam);

module.exports = router;
