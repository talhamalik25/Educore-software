const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
    },
    invoiceNumber: {
        type: String,
        unique: true,
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
    },
    feeIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Fee',
    }],
    issuedTo: {
        type: String,
        required: true,
    },
    issuedDate: {
        type: Date,
        default: Date.now,
    },
    dueDate: {
        type: Date,
        required: true,
    },
    lineItems: [{
        description: String,
        month: String,
        amount: Number,
        status: String,
    }],
    subtotal: {
        type: Number,
        required: true,
    },
    discount: {
        type: Number,
        default: 0,
    },
    discountReason: {
        type: String,
        default: '',
    },
    lateFine: {
        type: Number,
        default: 0,
    },
    totalAmount: {
        type: Number,
        required: true,
    },
    amountPaid: {
        type: Number,
        default: 0,
    },
    balanceDue: {
        type: Number,
        default: 0,
    },
    paymentStatus: {
        type: String,
        enum: ['unpaid', 'partial', 'paid'],
        default: 'unpaid',
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'jazzcash', 'easypaisa', 'bank'],
        default: null,
    },
    paidAt: {
        type: Date,
        default: null,
    },
    notes: {
        type: String,
        default: '',
    },
    generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true });

// Pre-save hook: Auto-generate invoiceNumber and calculate balance/status
invoiceSchema.pre('save', async function (next) {
    if (!this.invoiceNumber) {
        const count = await mongoose.model('Invoice').countDocuments({ schoolId: this.schoolId });
        const year = new Date().getFullYear();
        this.invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, '0')}`;
    }

    this.balanceDue = this.totalAmount - this.amountPaid;
    
    if (this.balanceDue <= 0) {
        this.paymentStatus = 'paid';
    } else if (this.amountPaid > 0) {
        this.paymentStatus = 'partial';
    } else {
        this.paymentStatus = 'unpaid';
    }

    next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
