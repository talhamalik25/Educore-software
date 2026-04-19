const express = require('express');
const router = express.Router();
const { getReportCardData, generateReportCardPDF } = require('../controllers/reportCard.controller');
const protect = require('../middleware/protect');
const requireRole = require('../middleware/requireRole');

router.get('/:studentId', protect, requireRole('admin', 'teacher', 'parent'), getReportCardData);
router.get('/:studentId/pdf', protect, requireRole('admin', 'teacher', 'parent'), generateReportCardPDF);

module.exports = router;