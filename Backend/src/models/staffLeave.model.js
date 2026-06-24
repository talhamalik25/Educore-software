const mongoose = require('mongoose');

const staffLeaveSchema = new mongoose.Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    leaveType: {
        type: String,
        enum: ['sick', 'casual', 'annual', 'unpaid', 'other'],
        default: 'casual',
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required'],
    },
    endDate: {
        type: Date,
        required: [true, 'End date is required'],
    },
    totalDays: {
        type: Number,
    },
    reason: {
        type: String,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    reviewedAt: {
        type: Date,
    },
    reviewNote: {
        type: String,
    },
}, { timestamps: true });

staffLeaveSchema.index({ schoolId: 1, userId: 1, status: 1 });

module.exports = mongoose.model('StaffLeave', staffLeaveSchema);
