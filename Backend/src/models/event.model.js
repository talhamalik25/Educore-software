const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
    },
    title: {
        type: String,
        required: [true, 'Event title is required'],
        trim: true,
    },
    description: {
        type: String,
    },
    eventType: {
        type: String,
        enum: ['academic', 'cultural', 'sports', 'holiday', 'meeting', 'exam', 'other'],
        default: 'other',
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required'],
    },
    endDate: {
        type: Date,
    },
    location: {
        type: String,
    },
    targetAudience: {
        type: String,
        enum: ['all', 'students', 'parents', 'teachers', 'class'],
        default: 'all',
    },
    targetClass: {
        type: String,
    },
    isPublic: {
        type: Boolean,
        default: true,
    },
    notifyParents: {
        type: Boolean,
        default: false,
    },
    rsvpEnabled: {
        type: Boolean,
        default: false,
    },
    rsvps: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        response: { type: String, enum: ['yes', 'no', 'maybe'] },
        respondedAt: { type: Date, default: Date.now },
    }],
    attachments: [{
        name: String,
        url: String,
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, { timestamps: true });

eventSchema.index({ schoolId: 1, startDate: 1 });

module.exports = mongoose.model('Event', eventSchema);
