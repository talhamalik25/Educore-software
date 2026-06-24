const mongoose = require('mongoose');

const staffAttendanceSchema = new mongoose.Schema({
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
    date: {
        type: Date,
        required: [true, 'Date is required'],
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'late', 'half_day'],
        default: 'present',
    },
    checkIn: {
        type: String,
    },
    checkOut: {
        type: String,
    },
    note: {
        type: String,
    },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, { timestamps: true });

staffAttendanceSchema.index({ schoolId: 1, userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('StaffAttendance', staffAttendanceSchema);
