const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
    },
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    role: {
        type: String,
        enum: ['parent', 'teacher', 'student'],
        required: true,
    },
    category: {
        type: String,
        enum: ['academic', 'fee', 'behavior', 'facility', 'teacher', 'other'],
        required: true,
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
    },
    isAnonymous: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'resolved', 'closed'],
        default: 'open',
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
    },
    adminReply: {
        type: String,
        default: null,
    },
    repliedAt: {
        type: Date,
        default: null,
    },
    repliedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    resolvedAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
