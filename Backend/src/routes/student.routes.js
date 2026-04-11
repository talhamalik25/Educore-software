const express = require('express');
const router = express.Router();
const { createStudent, getStudents, getStudent, updateStudent, deleteStudent } = require('../controllers/student.controller');
const protect = require('../middleware/protect');
const requireRole = require('../middleware/requireRole');
const { checkLimit } = require('../middleware/checkFeature');
const Student = require('../models/student.model');

router.post('/',      protect, requireRole('admin'), checkLimit('maxStudents', async (req) => {
    return await Student.countDocuments({ schoolId: req.user.schoolId, isActive: true });
}), createStudent);
router.get('/',       protect, requireRole('admin', 'teacher', 'parent'), getStudents);
router.get('/:id',    protect, requireRole('admin', 'teacher'), getStudent);
router.put('/:id',    protect, requireRole('admin'), updateStudent);
router.delete('/:id', protect, requireRole('admin'), deleteStudent);

module.exports = router;
