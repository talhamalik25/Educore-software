const Notification = require('../models/notification.model');
const School = require('../models/school.model');
const PLAN_FEATURES = require('../config/planFeatures');
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
        const { studentId, parentPhone, type, message } = req.body;

        // Check SMS limit for this school's plan
        const school = await School.findById(req.user.schoolId);
        const plan = PLAN_FEATURES[school?.plan];
        
        if (plan && plan.maxSmsPerMonth !== Infinity) {
            // Count SMS sent this month
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            
            const smsThisMonth = await Notification.countDocuments({
                schoolId: req.user.schoolId,
                status: 'sent',
                createdAt: { $gte: startOfMonth }
            });
            
            if (smsThisMonth >= plan.maxSmsPerMonth) {
                // Save notification record but skip actual SMS
                const notification = await Notification.create({
                    schoolId: req.user.schoolId,
                    studentId,
                    parentPhone,
                    type,
                    message,
                    status: 'skipped_limit',
                });
                return sendSuccess(res, 201, `SMS quota reached for ${school.plan} plan. Notification logged but SMS not sent.`, { notification });
            }
        }

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

