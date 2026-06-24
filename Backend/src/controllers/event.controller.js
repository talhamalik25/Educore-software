const Event = require('../models/event.model');
const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// @desc    Create event
// @route   POST /api/events
// @access  Admin
const createEvent = async (req, res) => {
    try {
        const event = await Event.create({
            ...req.body,
            schoolId: req.user.schoolId,
            createdBy: req.user._id,
        });

        // Notify parents if flag is set
        if (req.body.notifyParents) {
            try {
                const parents = await User.find({
                    schoolId: req.user.schoolId,
                    role: 'parent',
                    isActive: true,
                });

                const notifications = parents.map(parent => ({
                    schoolId: req.user.schoolId,
                    parentPhone: parent.phone,
                    type: 'fee_reminder', // reusing existing enum type
                    message: `New event: "${event.title}" on ${new Date(event.startDate).toLocaleDateString()}. ${event.location ? `Location: ${event.location}` : ''}`,
                    status: 'sent',
                }));

                if (notifications.length > 0) {
                    await Notification.insertMany(notifications);
                }
            } catch (notifErr) {
                console.error('Failed to send event notifications:', notifErr.message);
            }
        }

        return sendSuccess(res, 201, 'Event created successfully', { event });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Get all events
// @route   GET /api/events
// @access  Admin, Teacher, Parent
const getAllEvents = async (req, res) => {
    try {
        const filter = { schoolId: req.user.schoolId };

        // Parents only see public events
        if (req.user.role === 'parent') {
            filter.isPublic = true;
        }

        if (req.query.type) filter.eventType = req.query.type;
        if (req.query.month) {
            const [year, month] = req.query.month.split('-');
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);
            filter.startDate = { $gte: startDate, $lte: endDate };
        }

        const events = await Event.find(filter).sort({ startDate: -1 });
        return sendSuccess(res, 200, 'Events fetched', { events });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Get event by ID
// @route   GET /api/events/:id
// @access  Any Auth
const getEventById = async (req, res) => {
    try {
        const event = await Event.findOne({
            _id: req.params.id,
            schoolId: req.user.schoolId,
        });
        if (!event) return sendError(res, 404, 'Event not found.');
        return sendSuccess(res, 200, 'Event fetched', { event });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Admin
const updateEvent = async (req, res) => {
    try {
        const event = await Event.findOneAndUpdate(
            { _id: req.params.id, schoolId: req.user.schoolId },
            req.body,
            { new: true, runValidators: true }
        );
        if (!event) return sendError(res, 404, 'Event not found.');
        return sendSuccess(res, 200, 'Event updated', { event });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Admin
const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findOneAndDelete({
            _id: req.params.id,
            schoolId: req.user.schoolId,
        });
        if (!event) return sendError(res, 404, 'Event not found.');
        return sendSuccess(res, 200, 'Event deleted successfully');
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Submit RSVP
// @route   POST /api/events/:id/rsvp
// @access  Any Auth
const submitRsvp = async (req, res) => {
    try {
        const event = await Event.findOne({
            _id: req.params.id,
            schoolId: req.user.schoolId,
        });
        if (!event) return sendError(res, 404, 'Event not found.');
        if (!event.rsvpEnabled) return sendError(res, 400, 'RSVP is not enabled for this event.');

        // Update existing or add new RSVP
        const existingIdx = event.rsvps.findIndex(
            r => r.userId.toString() === req.user._id.toString()
        );
        if (existingIdx > -1) {
            event.rsvps[existingIdx].response = req.body.response;
            event.rsvps[existingIdx].respondedAt = new Date();
        } else {
            event.rsvps.push({
                userId: req.user._id,
                response: req.body.response,
                respondedAt: new Date(),
            });
        }

        await event.save();
        return sendSuccess(res, 200, 'RSVP submitted', { event });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Get event statistics
// @route   GET /api/events/stats
// @access  Admin
const getEventStats = async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const next30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const [total, thisMonth, upcoming, byType] = await Promise.all([
            Event.countDocuments({ schoolId }),
            Event.countDocuments({ schoolId, startDate: { $gte: startOfMonth } }),
            Event.countDocuments({ schoolId, startDate: { $gte: now, $lte: next30 } }),
            Event.aggregate([
                { $match: { schoolId } },
                { $group: { _id: '$eventType', count: { $sum: 1 } } },
            ]),
        ]);

        return sendSuccess(res, 200, 'Event stats fetched', {
            total,
            thisMonth,
            upcoming,
            byType,
        });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

module.exports = {
    createEvent,
    getAllEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    submitRsvp,
    getEventStats,
};
