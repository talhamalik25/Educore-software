const express = require('express');
const router = express.Router();
const {
    addResult,
    updateResult,
    deleteResult,
    getResultsByStudent,
    getResultsByClass,
    getMyResults,
    getResultStats,
} = require('../controllers/result.controller');
const protect = require('../middleware/protect');
const requireRole = require('../middleware/requireRole');

// All routes are protected
router.use(protect);

// GET /stats - Result stats for dashboard
router.get('/stats', requireRole('admin', 'teacher'), getResultStats);

// POST / - Teacher/Admin adds a result
router.post('/', requireRole('admin', 'teacher'), addResult);

// PUT /:id - Teacher/Admin updates a result
router.put('/:id', requireRole('admin', 'teacher'), updateResult);

// DELETE /:id - Admin only deletes a result
router.delete('/:id', requireRole('admin'), deleteResult);

// GET /student/:studentId - Admin, Teacher, Parent can view results for a specific student
router.get('/student/:studentId', requireRole('admin', 'teacher', 'parent'), getResultsByStudent);

// GET /class - Admin, Teacher can view results for a class+section
router.get('/class', requireRole('admin', 'teacher'), getResultsByClass);

// GET /my - Parent can view results of their linked students
router.get('/my', requireRole('parent'), getMyResults);

module.exports = router;
