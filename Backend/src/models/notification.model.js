const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
    },
    parentPhone: {
        type: String,
    },
    type: {
        type: String,
        enum: ['attendance_absent', 'attendance_late', 'fee_reminder', 'fee_received'],
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['sent', 'failed', 'pending', 'skipped_limit'],
        default: 'pending',
    },
}, { timestamps: true });

notificationSchema.index({ schoolId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

