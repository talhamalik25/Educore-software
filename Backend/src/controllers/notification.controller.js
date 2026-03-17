const Notification = require('../models/notification.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// @desc    Get notifications for a school
// @route   GET /api/notifications
// @access  Admin
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ schoolId: req.user.schoolId })
            .populate('studentId', 'name rollNumber class section parentPhone')
            .sort({ createdAt: -1 });

        return sendSuccess(res, 200, 'Notifications fetched', { notifications });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Create notification record (internal stub)
// @route   POST /api/notifications
// @access  Admin, Teacher
const createNotification = async (req, res) => {
    try {
        const { studentId, parentPhone, type, message, status } = req.body;

        const notification = await Notification.create({
            schoolId: req.user.schoolId,
            studentId,
            parentPhone,
            type,
            message,
            status: status || 'pending',
        });

        // Stub behavior: log to console instead of SMS provider
        // eslint-disable-next-line no-console
        console.log(`[SMS-STUB] ${type} → ${parentPhone || 'N/A'}: ${message}`);

        return sendSuccess(res, 201, 'Notification created', { notification });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

module.exports = { getNotifications, createNotification };

