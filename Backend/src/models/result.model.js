const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
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
    class: {
        type: String,
        required: [true, 'Class is required'],
    },
    section: {
        type: String,
        required: [true, 'Section is required'],
    },
    subject: {
        type: String,
        required: [true, 'Subject is required'],
    },
    examType: {
        type: String,
        enum: ['monthly', 'midterm', 'final', 'quiz'],
        required: [true, 'Exam type is required'],
    },
    totalMarks: {
        type: Number,
        required: [true, 'Total marks is required'],
    },
    obtainedMarks: {
        type: Number,
        required: [true, 'Obtained marks is required'],
    },
    grade: {
        type: String,
        default: null,
    },
    remarks: {
        type: String,
        default: '',
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    examDate: {
        type: Date,
        required: [true, 'Exam date is required'],
    },
}, { timestamps: true });

// Auto-calculate grade from percentage before saving
resultSchema.pre('save', function (next) {
    if (this.isModified('obtainedMarks') || this.isModified('totalMarks')) {
        const percentage = (this.obtainedMarks / this.totalMarks) * 100;

        if (percentage >= 90) this.grade = 'A+';
        else if (percentage >= 80) this.grade = 'A';
        else if (percentage >= 70) this.grade = 'B';
        else if (percentage >= 60) this.grade = 'C';
        else if (percentage >= 50) this.grade = 'D';
        else this.grade = 'F';
    }
    next();
});

module.exports = mongoose.model('Result', resultSchema);
