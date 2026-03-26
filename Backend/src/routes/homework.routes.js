const express = require('express');
const router = express.Router();
const { 
    createHomework, 
    getHomework, 
    getHomeworkDetails, 
    submitHomework 
} = require('../controllers/homework.controller');
const protect = require('../middleware/protect');
const requireRole = require('../middleware/requireRole');
const { upload } = require('../config/cloudinary');

// All routes are protected
router.use(protect);

// Teacher/Admin Routes
router.post(
    '/', 
    requireRole('teacher', 'admin'), 
    upload.array('attachments', 5), 
    createHomework
);

router.get(
    '/:id', 
    requireRole('teacher', 'admin'), 
    getHomeworkDetails
);

// General Routes (Student/Parent/Teacher/Admin)
router.get('/', getHomework);

// Student/Parent Routes
router.post(
    '/:id/submit', 
    requireRole('parent', 'student'), 
    upload.single('submission'), 
    submitHomework
);

module.exports = router;
