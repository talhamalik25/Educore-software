const express = require('express');
const router = express.Router();
const protect = require('../middleware/protect');
const requireRole = require('../middleware/requireRole');
const { 
    getOverviewAnalytics, 
    getAttendanceAnalytics, 
    getFeeAnalytics, 
    getResultsAnalytics 
} = require('../controllers/analytics.controller');

router.get('/overview', protect, requireRole('admin'), getOverviewAnalytics);
router.get('/attendance', protect, requireRole('admin'), getAttendanceAnalytics);
router.get('/fees', protect, requireRole('admin'), getFeeAnalytics);
router.get('/results', protect, requireRole('admin'), getResultsAnalytics);

module.exports = router;
