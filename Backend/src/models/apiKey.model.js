const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    keyHash: {
        type: String,
        required: true,
    },
    keyPrefix: {
        type: String,
        required: true,
    },
    permissions: [{
        type: String,
        enum: [
            'students:read',
            'attendance:read',
            'fees:read',
            'results:read',
            'timetable:read',
            'notifications:read'
        ],
    }],
    isActive: {
        type: Boolean,
        default: true,
    },
    lastUsedAt: {
        type: Date,
        default: null,
    },
    expiresAt: {
        type: Date,
        default: null,
    },
    requestCount: {
        type: Number,
        default: 0,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, { timestamps: true });

module.exports = mongoose.model('ApiKey', apiKeySchema);
