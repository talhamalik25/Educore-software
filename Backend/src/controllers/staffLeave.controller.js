const StaffLeave = require('../models/staffLeave.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// @desc    Apply for leave (teacher for self, admin for anyone)
// @route   POST /api/staff-leaves
// @access  Admin, Teacher
const applyLeave = async (req, res) => {
    try {
        const { startDate, endDate, leaveType, reason, userId } = req.body;

        // Teachers can only apply for themselves
        const targetUserId = req.user.role === 'admin' && userId ? userId : req.user._id;

        // Calculate total days
        const start = new Date(startDate);
        const end = new Date(endDate);
        const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        const leave = await StaffLeave.create({
            schoolId: req.user.schoolId,
            userId: targetUserId,
            leaveType,
            startDate,
            endDate,
            totalDays,
            reason,
        });

        return sendSuccess(res, 201, 'Leave application submitted', { leave });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Get all staff leaves (admin)
// @route   GET /api/staff-leaves
// @access  Admin
const getAllLeaves = async (req, res) => {
    try {
        const filter = { schoolId: req.user.schoolId };
        if (req.query.userId) filter.userId = req.query.userId;
        if (req.query.status) filter.status = req.query.status;

        const leaves = await StaffLeave.find(filter)
            .populate('userId', 'name email role')
            .populate('reviewedBy', 'name')
            .sort({ createdAt: -1 });

        return sendSuccess(res, 200, 'Leaves fetched', { leaves });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Get my leaves (teacher)
// @route   GET /api/staff-leaves/my
// @access  Teacher
const getMyLeaves = async (req, res) => {
    try {
        const leaves = await StaffLeave.find({
            schoolId: req.user.schoolId,
            userId: req.user._id,
        })
        .populate('reviewedBy', 'name')
        .sort({ createdAt: -1 });

        return sendSuccess(res, 200, 'My leaves fetched', { leaves });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Review leave (approve/reject)
// @route   PUT /api/staff-leaves/:id/review
// @access  Admin
const reviewLeave = async (req, res) => {
    try {
        const { status, reviewNote } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
            return sendError(res, 400, 'Status must be approved or rejected.');
        }

        const leave = await StaffLeave.findOneAndUpdate(
            { _id: req.params.id, schoolId: req.user.schoolId },
            {
                status,
                reviewedBy: req.user._id,
                reviewedAt: new Date(),
                reviewNote,
            },
            { new: true }
        ).populate('userId', 'name email role');

        if (!leave) return sendError(res, 404, 'Leave not found.');
        return sendSuccess(res, 200, `Leave ${status}`, { leave });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Delete leave (admin, only pending)
// @route   DELETE /api/staff-leaves/:id
// @access  Admin
const deleteLeave = async (req, res) => {
    try {
        const leave = await StaffLeave.findOne({
            _id: req.params.id,
            schoolId: req.user.schoolId,
        });
        if (!leave) return sendError(res, 404, 'Leave not found.');
        if (leave.status !== 'pending') return sendError(res, 400, 'Only pending leaves can be deleted.');

        await StaffLeave.deleteOne({ _id: req.params.id });
        return sendSuccess(res, 200, 'Leave deleted successfully');
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

module.exports = { applyLeave, getAllLeaves, getMyLeaves, reviewLeave, deleteLeave };
