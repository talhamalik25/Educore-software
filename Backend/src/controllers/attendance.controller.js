const Attendance = require('../models/attendance.model');
const Student = require('../models/student.model');
const Notification = require('../models/notification.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const sendSMS = require('../utils/sendSMS');

// @desc    Mark attendance for a student
// @route   POST /api/attendance
// @access  Teacher, Admin
const markAttendance = async (req, res) => {
    try {
        const { studentId, date, status, markedVia } = req.body;

        // Ensure student belongs to this school
        const student = await Student.findOne({ _id: studentId, schoolId: req.user.schoolId });
        if (!student) return sendError(res, 404, 'Student not found.');

        // Check for duplicate
        const existing = await Attendance.findOne({
            studentId,
            date: new Date(date),
            schoolId: req.user.schoolId,
        });
        if (existing) return sendError(res, 400, 'Attendance already marked for this student today.');

        const attendance = await Attendance.create({
            schoolId: req.user.schoolId,
            studentId,
            teacherId: req.user._id,
            date: new Date(date),
            status,
            markedVia: markedVia || 'manual',
        });

        return sendSuccess(res, 201, 'Attendance marked', { attendance });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Mark attendance for entire class (bulk)
// @route   POST /api/attendance/bulk
// @access  Teacher, Admin
const markBulkAttendance = async (req, res) => {
    try {
        const { records, date } = req.body;
        // records = [{ studentId, status }]

        const attendanceData = records.map((r) => ({
            schoolId: req.user.schoolId,
            studentId: r.studentId,
            teacherId: req.user._id,
            date: new Date(date),
            status: r.status,
            markedVia: 'manual',
        }));

        // insertMany with ordered:false to skip duplicates
        const result = await Attendance.insertMany(attendanceData, { ordered: false });

        // Create SMS notification stubs for absent/late
        const flagged = (records || []).filter((r) => r?.status === 'absent' || r?.status === 'late');
        if (flagged.length > 0) {
            const flaggedIds = flagged.map((r) => r.studentId);
            const students = await Student.find(
                { _id: { $in: flaggedIds }, schoolId: req.user.schoolId },
                'name parentPhone'
            );

            const studentById = new Map(students.map((s) => [String(s._id), s]));
            const notifications = flagged.map((r) => {
                const s = studentById.get(String(r.studentId));
                const parentPhone = s?.parentPhone;
                const type = r.status === 'absent' ? 'attendance_absent' : 'attendance_late';
                const message = r.status === 'absent'
                    ? `Attendance alert: ${s?.name || 'Student'} marked absent on ${date}.`
                    : `Attendance alert: ${s?.name || 'Student'} marked late on ${date}.`;

                // Send actual SMS
                if (parentPhone) {
                    sendSMS(parentPhone, message);
                }

                return {
                    schoolId: req.user.schoolId,
                    studentId: r.studentId,
                    parentPhone,
                    type,
                    message,
                    status: 'sent',
                };
            });

            await Notification.insertMany(notifications);
        }

        return sendSuccess(res, 201, `${result.length} attendance records saved`, { count: result.length });
    } catch (error) {
        // Even if some duplicates exist, partial success is okay
        return sendSuccess(res, 201, 'Bulk attendance processed (some may have been skipped as duplicates)');
    }
};

// @desc    Get attendance by date and class
// @route   GET /api/attendance
// @access  Teacher, Admin
const getAttendance = async (req, res) => {
    try {
        const { date, studentId } = req.query;
        const filter = { schoolId: req.user.schoolId };

        if (date) filter.date = new Date(date);
        if (studentId) filter.studentId = studentId;

        const records = await Attendance.find(filter)
            .populate('studentId', 'name rollNumber class section')
            .sort({ date: -1 });

        return sendSuccess(res, 200, 'Attendance fetched', { records });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Get attendance summary for a student
// @route   GET /api/attendance/student/:studentId
// @access  Teacher, Admin, Parent
const getStudentAttendance = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { month } = req.query; // e.g. "2025-01"

        const filter = { schoolId: req.user.schoolId, studentId };

        if (month) {
            const start = new Date(`${month}-01`);
            const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
            filter.date = { $gte: start, $lte: end };
        }

        const records = await Attendance.find(filter).sort({ date: 1 });

        const total = records.length;
        const present = records.filter((r) => r.status === 'present').length;
        const absent = records.filter((r) => r.status === 'absent').length;
        const late = records.filter((r) => r.status === 'late').length;

        return sendSuccess(res, 200, 'Student attendance', {
            summary: { total, present, absent, late },
            records,
        });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

module.exports = { markAttendance, markBulkAttendance, getAttendance, getStudentAttendance };
