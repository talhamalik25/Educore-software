const express = require('express');
const router = express.Router();
const { 
    createSchool, 
    getAllSchools, 
    getSchool, 
    updateSchool,
    updateSchoolSettings,
    uploadSchoolLogo 
} = require('../controllers/school.controller');
const protect = require('../middleware/protect');
const requireRole = require('../middleware/requireRole');
const { uploadLogo } = require('../config/cloudinary');

router.post('/',    protect, requireRole('superadmin'), createSchool);
router.get('/',     protect, requireRole('superadmin'), getAllSchools);

// Admin school settings
router.put('/settings', protect, requireRole('admin'), updateSchoolSettings);
router.post('/logo',     protect, requireRole('admin'), uploadLogo.single('logo'), uploadSchoolLogo);

router.get('/:id',  protect, requireRole('superadmin', 'admin'), getSchool);
router.put('/:id',  protect, requireRole('superadmin'), updateSchool);

module.exports = router;
