const express = require('express');
const router = express.Router();
const { markAttendance, markBulkAttendance, getAttendance, getStudentAttendance } = require('../controllers/attendance.controller');
const protect = require('../middleware/protect');
const requireRole = require('../middleware/requireRole');
const checkFeature = require('../middleware/checkFeature');

router.post('/',                          protect, requireRole('admin', 'teacher'), checkFeature('attendance_basic'), markAttendance);
router.post('/bulk',                      protect, requireRole('admin', 'teacher'), checkFeature('attendance_basic'), markBulkAttendance);
router.get('/',                           protect, requireRole('admin', 'teacher'), checkFeature('attendance_basic'), getAttendance);
router.get('/student/:studentId',         protect, requireRole('admin', 'teacher', 'parent'), checkFeature('attendance_basic'), getStudentAttendance);

module.exports = router;
