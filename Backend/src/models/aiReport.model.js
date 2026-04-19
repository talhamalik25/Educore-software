const mongoose = require('mongoose');

const aiReportSchema = new mongoose.Schema({
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
    /** YYYY-MM — one report per student per calendar month (upsert target) */
    reportMonth: {
        type: String,
        required: true,
    },
    generatedAt: {
        type: Date,
        default: Date.now,
    },
    attendanceScore: {
        type: Number,
        min: 0,
        max: 100,
    },
    averageGrade: {
        type: Number,
        min: 0,
        max: 100,
    },
    weakSubjects: {
        type: [String],
        default: [],
    },
    strongSubjects: {
        type: [String],
        default: [],
    },
    riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high'],
        required: true,
    },
    aiSummary: {
        type: String,
        default: '',
    },
    recommendations: {
        type: [String],
        default: [],
    },
}, { timestamps: true });

aiReportSchema.index({ schoolId: 1, studentId: 1, reportMonth: 1 }, { unique: true });

module.exports = mongoose.model('AiReport', aiReportSchema);
