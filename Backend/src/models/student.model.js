const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
    },
    name: {
        type: String,
        required: [true, 'Student name is required'],
        trim: true,
    },
    rollNumber: {
        type: String,
        required: [true, 'Roll number is required'],
    },
    class: {
        type: String,
        required: [true, 'Class is required'],
    },
    section: {
        type: String,
        required: [true, 'Section is required'],
    },
    dateOfBirth: {
        type: Date,
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    parentPhone: {
        type: String,
        required: [true, 'Parent phone number is required'],
        trim: true,
    },
    feeStatus: {
        type: String,
        enum: ['paid', 'unpaid', 'partial'],
        default: 'unpaid',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

// Compound index for multi-tenant uniqueness
studentSchema.index({ schoolId: 1, rollNumber: 1 }, { unique: true });

module.exports = mongoose.model('Student', studentSchema);
