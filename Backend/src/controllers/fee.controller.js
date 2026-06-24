const Fee = require('../models/fee.model');
const Student = require('../models/student.model');
const Notification = require('../models/notification.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const sendSMS = require('../utils/sendSMS');

// @desc    Create fee record for a student
// @route   POST /api/fees
// @access  Admin
const createFee = async (req, res) => {
    try {
        const { studentId, amount, month, dueDate, remarks } = req.body;

        // Ensure student belongs to this school
        const student = await Student.findOne({ _id: studentId, schoolId: req.user.schoolId });
        if (!student) return sendError(res, 404, 'Student not found.');

        // Prevent duplicate fee for same student + month
        const existing = await Fee.findOne({ studentId, month, schoolId: req.user.schoolId });
        if (existing) return sendError(res, 400, `Fee for ${month} already exists for this student.`);

        const fee = await Fee.create({
            schoolId: req.user.schoolId,
            studentId,
            amount,
            month,
            dueDate,
            remarks,
        });

        return sendSuccess(res, 201, 'Fee record created', { fee });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Get all fees (with optional filters)
// @route   GET /api/fees
// @access  Admin
const getFees = async (req, res) => {
    try {
        const filter = { schoolId: req.user.schoolId };
        if (req.query.status) filter.status = req.query.status;
        if (req.query.month) filter.month = req.query.month;
        if (req.query.studentId) filter.studentId = req.query.studentId;

        const fees = await Fee.find(filter)
            .populate('studentId', 'name rollNumber class section')
            .sort({ dueDate: 1 });

        return sendSuccess(res, 200, 'Fees fetched', { fees });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Mark fee as paid
// @route   PUT /api/fees/:id/pay
// @access  Admin
const markFeePaid = async (req, res) => {
    try {
        const { paymentMethod, transactionId } = req.body;

        const fee = await Fee.findOneAndUpdate(
            { _id: req.params.id, schoolId: req.user.schoolId },
            {
                status: 'paid',
                paidAt: new Date(),
                paymentMethod,
                transactionId,
                collectedBy: req.user._id,
            },
            { new: true }
        );

        if (!fee) return sendError(res, 404, 'Fee record not found.');

        // Update student feeStatus
        await Student.findByIdAndUpdate(fee.studentId, { feeStatus: 'paid' });

        // Create SMS notification stub
        const student = await Student.findOne(
            { _id: fee.studentId, schoolId: req.user.schoolId },
            'name parentPhone'
        );
        if (student) {
            const parentPhone = student.parentPhone;
            const message = `Fee received: PKR ${fee.amount} for ${student.name} (${fee.month}).`;

            // Send actual SMS
            if (parentPhone) {
                sendSMS(parentPhone, message);
            }

            await Notification.create({
                schoolId: req.user.schoolId,
                studentId: student._id,
                parentPhone,
                type: 'fee_received',
                message,
                status: 'sent',
            });
        }

        return sendSuccess(res, 200, 'Fee marked as paid', { fee });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Get fee summary for a school (dashboard stats)
// @route   GET /api/fees/summary
// @access  Admin
const getFeeSummary = async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const { month } = req.query;

        const filter = { schoolId };
        if (month) filter.month = month;

        const total = await Fee.countDocuments(filter);
        const paid = await Fee.countDocuments({ ...filter, status: 'paid' });
        const unpaid = await Fee.countDocuments({ ...filter, status: 'unpaid' });
        const overdue = await Fee.countDocuments({ ...filter, status: 'overdue' });

        const totalAmount = await Fee.aggregate([
            { $match: { ...filter, status: 'paid' } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);

        return sendSuccess(res, 200, 'Fee summary', {
            total,
            paid,
            unpaid,
            overdue,
            totalCollected: totalAmount[0]?.total || 0,
        });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};


// @desc    Auto-mark overdue fees (run on server startup + daily)
// @route   called internally (no route needed)
const markOverdueFees = async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const result = await Fee.updateMany(
            {
                status: 'unpaid',
                dueDate: { $lt: today },
            },
            { $set: { status: 'overdue' } }
        );

        if (result.modifiedCount > 0) {
            console.log(`✅ Marked ${result.modifiedCount} fees as overdue.`);
        }
    } catch (error) {
        console.error('❌ Overdue fee job failed:', error.message);
    }
};

// @desc    Get fees for parent's children
// @route   GET /api/fees/my-child
// @access  Parent
const getMyChildFees = async (req, res) => {
    try {
        // Find all students where parentId matches or parentPhone matches user's phone
        const students = await Student.find({
            schoolId: req.user.schoolId,
            $or: [
                { parentId: req.user._id },
                { parentPhone: req.user.phone }
            ]
        });

        const studentIds = students.map(s => s._id);

        const fees = await Fee.find({
            schoolId: req.user.schoolId,
            studentId: { $in: studentIds }
        })
        .populate('studentId', 'name rollNumber class section')
        .sort({ dueDate: -1 });

        return sendSuccess(res, 200, 'Child fees fetched', { fees });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

module.exports = { createFee, getFees, markFeePaid, getFeeSummary, markOverdueFees, getMyChildFees };
