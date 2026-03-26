const Notification = require('../models/notification.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const sendSMS = require('../utils/sendSMS');

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
            status: 'sent',
        });

        // Send actual SMS
        if (parentPhone) {
            sendSMS(parentPhone, message);
        }

        return sendSuccess(res, 201, 'Notification created', { notification });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

module.exports = { getNotifications, createNotification };

