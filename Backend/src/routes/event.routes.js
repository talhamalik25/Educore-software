const express = require('express');
const router = express.Router();
const {
    createEvent,
    getAllEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    submitRsvp,
    getEventStats,
} = require('../controllers/event.controller');
const protect = require('../middleware/protect');
const requireRole = require('../middleware/requireRole');

router.post('/',        protect, requireRole('admin'), createEvent);
router.get('/',         protect, requireRole('admin', 'teacher', 'parent'), getAllEvents);
router.get('/stats',    protect, requireRole('admin'), getEventStats);
router.get('/:id',      protect, getEventById);
router.put('/:id',      protect, requireRole('admin'), updateEvent);
router.delete('/:id',   protect, requireRole('admin'), deleteEvent);
router.post('/:id/rsvp', protect, submitRsvp);

module.exports = router;
