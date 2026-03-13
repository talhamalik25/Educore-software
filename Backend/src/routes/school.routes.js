const express = require('express');
const router = express.Router();
const { createSchool, getAllSchools, getSchool, updateSchool } = require('../controllers/school.controller');
const protect = require('../middleware/protect');
const requireRole = require('../middleware/requireRole');

router.post('/',    protect, requireRole('superadmin'), createSchool);
router.get('/',     protect, requireRole('superadmin'), getAllSchools);
router.get('/:id',  protect, requireRole('superadmin', 'admin'), getSchool);
router.put('/:id',  protect, requireRole('superadmin'), updateSchool);

module.exports = router;
