const express = require('express');
const router = express.Router();
const { markStaffAttendance, getStaffAttendance, getMyAttendance } = require('../controllers/staffAttendance.controller');
const protect = require('../middleware/protect');
const requireRole = require('../middleware/requireRole');
const { checkFeatureFlag } = require('../middleware/checkFeature');

router.post('/',    protect, requireRole('admin'), checkFeatureFlag('staffAttendanceEnabled'), markStaffAttendance);
router.get('/',     protect, requireRole('admin'), checkFeatureFlag('staffAttendanceEnabled'), getStaffAttendance);
router.get('/my',   protect, requireRole('teacher'), checkFeatureFlag('staffAttendanceEnabled'), getMyAttendance);

module.exports = router;
