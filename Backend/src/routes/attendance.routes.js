const express = require('express');
const router = express.Router();
const { markAttendance, markBulkAttendance, getAttendance, getStudentAttendance } = require('../controllers/attendance.controller');
const protect = require('../middleware/protect');
const requireRole = require('../middleware/requireRole');
const { checkFeatureFlag } = require('../middleware/checkFeature');

router.post('/',                protect, requireRole('admin', 'teacher'), checkFeatureFlag('attendanceEnabled'), markAttendance);
router.post('/bulk',            protect, requireRole('admin', 'teacher'), checkFeatureFlag('attendanceEnabled'), markBulkAttendance);
router.get('/',                 protect, requireRole('admin', 'teacher'), getAttendance);
router.get('/student/:studentId', protect, requireRole('admin', 'teacher', 'parent'), getStudentAttendance);

module.exports = router;
