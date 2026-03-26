const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
    },
    homeworkId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Homework',
        required: true,
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
    },
    fileUrl: {
        type: String,
        required: [true, 'Submission file is required'],
    },
    publicId: {
        type: String,
    },
    fileName: {
        type: String,
    },
    submittedAt: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['pending', 'graded', 'late'],
        default: 'pending',
    },
    grade: {
        type: String,
    },
    feedback: {
        type: String,
    },
}, { timestamps: true });

// Prevent multiple submissions for same student and homework
submissionSchema.index({ homeworkId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);
