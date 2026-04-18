const express = require('express');
const router = express.Router();
const {
    submitComplaint,
    getMyComplaints,
    getAllComplaints,
    replyToComplaint,
    updateComplaintStatus,
    deleteComplaint,
    getComplaintStats,
} = require('../controllers/complaint.controller');
const protect = require('../middleware/protect');
const requireRole = require('../middleware/requireRole');

// All routes are protected
router.use(protect);

// POST / - Any authorized user submits a complaint
router.post('/', requireRole('admin', 'teacher', 'parent'), submitComplaint);

// GET /my - User gets their own complaints
router.get('/my', getMyComplaints);

// GET / - Admin gets all complaints
router.get('/', requireRole('admin'), getAllComplaints);

// GET /stats - Admin gets analytics
router.get('/stats', requireRole('admin'), getComplaintStats);

// PUT /:id/reply - Admin replies to a complaint
router.put('/:id/reply', requireRole('admin'), replyToComplaint);

// PUT /:id/status - Admin updates status
router.put('/:id/status', requireRole('admin'), updateComplaintStatus);

// DELETE /:id - Admin deletes a complaint
router.delete('/:id', requireRole('admin'), deleteComplaint);

module.exports = router;
