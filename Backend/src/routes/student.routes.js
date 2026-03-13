const express = require('express');
const router = express.Router();
const { createStudent, getStudents, getStudent, updateStudent, deleteStudent } = require('../controllers/student.controller');
const protect = require('../middleware/protect');
const requireRole = require('../middleware/requireRole');

router.post('/',      protect, requireRole('admin'), createStudent);
router.get('/',       protect, requireRole('admin', 'teacher'), getStudents);
router.get('/:id',    protect, requireRole('admin', 'teacher'), getStudent);
router.put('/:id',    protect, requireRole('admin'), updateStudent);
router.delete('/:id', protect, requireRole('admin'), deleteStudent);

module.exports = router;
