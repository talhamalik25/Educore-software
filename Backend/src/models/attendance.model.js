const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'late', 'leave'],
        required: true,
    },
    markedVia: {
        type: String,
        enum: ['manual', 'qr'],
        default: 'manual',
    },
    smsSent: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

// Prevent duplicate attendance for same student on same day
attendanceSchema.index({ schoolId: 1, studentId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
