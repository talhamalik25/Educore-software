const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'School name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
    },
    phone: {
        type: String,
        required: [true, 'Phone is required'],
    },
    address: {
        type: String,
        required: [true, 'Address is required'],
    },
    plan: {
        type: String,
        enum: ['starter', 'growth', 'enterprise'],
        default: 'starter',
    },
    isFoundingMember: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('School', schoolSchema);
