const express = require('express');
const router = express.Router();
const protect = require('../middleware/protect');
const requireRole = require('../middleware/requireRole');
const {
    createOrUpdateTimetable,
    getTimetableByClass,
    getTimetableByTeacher,
    deleteTimetableDay,
} = require('../controllers/timetable.controller');

// POST /api/timetable — Create or update timetable (admin only)
router.post('/', protect, requireRole('admin'), createOrUpdateTimetable);

// GET /api/timetable/class?class=10&section=A — Get class timetable
router.get('/class', protect, requireRole('admin', 'teacher', 'parent'), getTimetableByClass);

// GET /api/timetable/teacher/:teacherId — Get teacher schedule
router.get('/teacher/:teacherId', protect, requireRole('admin', 'teacher'), getTimetableByTeacher);

// DELETE /api/timetable/:id — Delete a timetable entry (admin only)
router.delete('/:id', protect, requireRole('admin'), deleteTimetableDay);

module.exports = router;
