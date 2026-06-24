const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
    },
    applicantName: {
        type: String,
        required: [true, 'Applicant name is required'],
        trim: true,
    },
    dateOfBirth: {
        type: Date,
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
    },
    applyingForClass: {
        type: String,
    },
    parentName: {
        type: String,
        required: [true, 'Parent name is required'],
        trim: true,
    },
    parentPhone: {
        type: String,
        required: [true, 'Parent phone is required'],
        trim: true,
    },
    parentEmail: {
        type: String,
        trim: true,
    },
    address: {
        type: String,
    },
    documents: [{
        name: String,
        url: String,
        publicId: String,
    }],
    status: {
        type: String,
        enum: ['inquiry', 'applied', 'under_review', 'waitlisted', 'admitted', 'rejected'],
        default: 'inquiry',
    },
    notes: {
        type: String,
    },
    admissionDate: {
        type: Date,
    },
    assignedClass: {
        type: String,
    },
    assignedSection: {
        type: String,
    },
    assignedRollNo: {
        type: String,
    },
    convertedStudentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, { timestamps: true });

admissionSchema.index({ schoolId: 1, status: 1 });

module.exports = mongoose.model('Admission', admissionSchema);
