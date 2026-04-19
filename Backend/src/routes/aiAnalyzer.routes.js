const express = require('express');
const router = express.Router();
const {
    analyzeStudent,
    getStudentReport,
    getClassRiskReport,
    getSchoolRiskSummary,
} = require('../controllers/aiAnalyzer.controller');
const protect = require('../middleware/protect');
const requireRole = require('../middleware/requireRole');

router.post('/analyze/:studentId', protect, requireRole('admin', 'teacher'), analyzeStudent);
router.get('/report/:studentId', protect, requireRole('admin', 'teacher', 'parent'), getStudentReport);
router.get('/class', protect, requireRole('admin', 'teacher'), getClassRiskReport);
router.get('/school-summary', protect, requireRole('admin'), getSchoolRiskSummary);

module.exports = router;
