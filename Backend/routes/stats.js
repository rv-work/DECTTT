const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

// Get platform statistics
router.get('/', statsController.getPlatformStats);

// Get daily/weekly/monthly stats
router.get('/daily', statsController.getDailyStats);
router.get('/weekly', statsController.getWeeklyStats);
router.get('/monthly', statsController.getMonthlyStats);

module.exports = router;