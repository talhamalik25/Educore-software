const StaffAttendance = require('../models/staffAttendance.model');
const User = require('../models/user.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// @desc    Bulk mark staff attendance for a date
// @route   POST /api/staff-attendance
// @access  Admin
const markStaffAttendance = async (req, res) => {
    try {
        const { date, records } = req.body;
        if (!date || !records || !Array.isArray(records)) {
            return sendError(res, 400, 'Date and records array are required.');
        }

        const results = [];
        for (const record of records) {
            const data = {
                schoolId: req.user.schoolId,
                userId: record.userId,
                date: new Date(date),
                status: record.status,
                checkIn: record.checkIn || '',
                checkOut: record.checkOut || '',
                note: record.note || '',
                markedBy: req.user._id,
            };

            // Upsert: update if exists, create if not
            const attendance = await StaffAttendance.findOneAndUpdate(
                { schoolId: req.user.schoolId, userId: record.userId, date: new Date(date) },
                data,
                { upsert: true, new: true, runValidators: true }
            );
            results.push(attendance);
        }

        return sendSuccess(res, 200, 'Staff attendance marked successfully', { records: results });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Get staff attendance (admin)
// @route   GET /api/staff-attendance
// @access  Admin
const getStaffAttendance = async (req, res) => {
    try {
        const filter = { schoolId: req.user.schoolId };

        if (req.query.date) {
            const d = new Date(req.query.date);
            d.setHours(0, 0, 0, 0);
            const next = new Date(d);
            next.setDate(next.getDate() + 1);
            filter.date = { $gte: d, $lt: next };
        }
        if (req.query.userId) filter.userId = req.query.userId;
        if (req.query.month) {
            const [year, month] = req.query.month.split('-');
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);
            filter.date = { $gte: startDate, $lte: endDate };
        }

        const records = await StaffAttendance.find(filter)
            .populate('userId', 'name email role')
            .sort({ date: -1 });

        return sendSuccess(res, 200, 'Staff attendance fetched', { records });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Get my attendance (teacher)
// @route   GET /api/staff-attendance/my
// @access  Teacher
const getMyAttendance = async (req, res) => {
    try {
        const filter = {
            schoolId: req.user.schoolId,
            userId: req.user._id,
        };

        if (req.query.month) {
            const [year, month] = req.query.month.split('-');
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);
            filter.date = { $gte: startDate, $lte: endDate };
        }

        const records = await StaffAttendance.find(filter).sort({ date: -1 });

        // Summary
        const present = records.filter(r => r.status === 'present').length;
        const absent = records.filter(r => r.status === 'absent').length;
        const late = records.filter(r => r.status === 'late').length;
        const halfDay = records.filter(r => r.status === 'half_day').length;

        return sendSuccess(res, 200, 'My attendance fetched', {
            records,
            summary: { present, absent, late, halfDay, total: records.length },
        });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

module.exports = { markStaffAttendance, getStaffAttendance, getMyAttendance };
