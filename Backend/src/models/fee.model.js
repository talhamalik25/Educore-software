const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
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
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
    },
    month: {
        type: String,
        required: [true, 'Month is required'], // e.g. "2025-01"
    },
    dueDate: {
        type: Date,
        required: true,
    },
    paidDate: {
        type: Date,
    },
    status: {
        type: String,
        enum: ['paid', 'unpaid', 'partial', 'overdue'],
        default: 'unpaid',
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'jazzcash', 'easypaisa', 'bank'],
    },
    transactionId: {
        type: String,
    },
    collectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    remarks: {
        type: String,
    },
}, { timestamps: true });

module.exports = mongoose.model('Fee', feeSchema);
