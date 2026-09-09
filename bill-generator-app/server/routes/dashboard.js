const express = require('express');
const { getDashboardSummary } = require('../controllers/dashboard');

const router = express.Router();

// GET /api/dashboard/summary
router.get('/summary', getDashboardSummary);

module.exports = router;
