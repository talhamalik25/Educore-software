const express = require('express');
const router = express.Router();
const protect = require('../middleware/protect');
const requireRole = require('../middleware/requireRole');
const {
    getAllSchools,
    createSchoolWithAdmin,
    updateSchool,
    toggleSchoolStatus,
    getSchoolStats,
} = require('../controllers/superadmin.controller');

// All routes require superadmin role
router.use(protect, requireRole('superadmin'));

router.get('/schools', getAllSchools);
router.post('/schools', createSchoolWithAdmin);
router.put('/schools/:id', updateSchool);
router.patch('/schools/:id/toggle', toggleSchoolStatus);
router.get('/stats', getSchoolStats);

module.exports = router;
