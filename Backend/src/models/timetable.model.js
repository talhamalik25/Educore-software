const mongoose = require('mongoose');

const periodSchema = new mongoose.Schema({
    periodNumber: {
        type: Number,
        required: [true, 'Period number is required'],
    },
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true,
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Teacher is required'],
    },
    startTime: {
        type: String,
        required: [true, 'Start time is required'],
    },
    endTime: {
        type: String,
        required: [true, 'End time is required'],
    },
}, { _id: false });

const timetableSchema = new mongoose.Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: [true, 'School ID is required'],
    },
    class: {
        type: String,
        required: [true, 'Class is required'],
        trim: true,
    },
    section: {
        type: String,
        required: [true, 'Section is required'],
        trim: true,
    },
    day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        required: [true, 'Day is required'],
    },
    periods: {
        type: [periodSchema],
        default: [],
    },
}, { timestamps: true });

// Compound index for fast lookups and uniqueness
timetableSchema.index({ schoolId: 1, class: 1, section: 1, day: 1 }, { unique: true });

module.exports = mongoose.model('Timetable', timetableSchema);
