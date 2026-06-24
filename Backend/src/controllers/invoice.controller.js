const Invoice = require('../models/invoice.model');
const Student = require('../models/student.model');
const Fee = require('../models/fee.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');

exports.generateInvoice = async (req, res) => {
    try {
        const { schoolId } = req.user;
        const { studentId, feeIds, issuedTo, dueDate, discount = 0, discountReason = '', lateFine = 0, notes = '' } = req.body;

        // Verify student belongs to school
        const student = await Student.findOne({ _id: studentId, schoolId });
        if (!student) return sendError(res, 404, 'Student not found or unauthorized');

        // Fetch and verify fees
        const fees = await Fee.find({ 
            _id: { $in: feeIds }, 
            schoolId, 
            studentId 
        });

        if (fees.length === 0) return sendError(res, 400, 'No valid fees selected');

        // Build line items
        const lineItems = fees.map(f => ({
            description: 'Tuition Fee',
            month: f.month,
            amount: f.amount,
            status: f.status
        }));

        const subtotal = fees.reduce((sum, f) => sum + (f.amount || 0), 0);
        const totalAmount = subtotal - (discount || 0) + (lateFine || 0);
        const amountPaid = fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + (f.amount || 0), 0);

        const invoice = await Invoice.create({
            schoolId,
            studentId,
            feeIds,
            issuedTo,
            dueDate,
            lineItems,
            subtotal,
            discount,
            discountReason,
            lateFine,
            totalAmount,
            amountPaid,
            notes,
            generatedBy: req.user._id
        });

        sendSuccess(res, 201, 'Invoice generated successfully', invoice);
    } catch (error) {
        sendError(res, 500, error.message);
    }
};

exports.getInvoices = async (req, res) => {
    try {
        const { schoolId } = req.user;
        const { studentId, paymentStatus } = req.query;

        const filter = { schoolId };
        if (studentId) filter.studentId = studentId;
        if (paymentStatus) filter.paymentStatus = paymentStatus;

        const invoices = await Invoice.find(filter)
            .populate('studentId', 'name rollNumber class section')
            .sort({ issuedDate: -1 });

        sendSuccess(res, 200, 'Invoices fetched successfully', invoices);
    } catch (error) {
        sendError(res, 500, error.message);
    }
};

exports.getStudentInvoices = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { schoolId } = req.user;

        const invoices = await Invoice.find({ studentId, schoolId })
            .sort({ issuedDate: -1 });

        sendSuccess(res, 200, 'Student invoices fetched successfully', invoices);
    } catch (error) {
        sendError(res, 500, error.message);
    }
};

exports.markInvoicePaid = async (req, res) => {
    try {
        const { id } = req.params;
        const { schoolId } = req.user;
        const { amountPaid, paymentMethod, paidAt } = req.body;

        const invoice = await Invoice.findOne({ _id: id, schoolId });
        if (!invoice) return sendError(res, 404, 'Invoice not found');

        invoice.amountPaid = amountPaid;
        invoice.paymentMethod = paymentMethod;
        invoice.paidAt = paidAt || Date.now();

        await invoice.save(); // Triggers pre-save hook for status update

        sendSuccess(res, 200, 'Invoice updated successfully', invoice);
    } catch (error) {
        sendError(res, 500, error.message);
    }
};

exports.deleteInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const { schoolId } = req.user;

        const invoice = await Invoice.findOne({ _id: id, schoolId });
        if (!invoice) return sendError(res, 404, 'Invoice not found');

        if (invoice.paymentStatus !== 'unpaid') {
            return sendError(res, 400, 'Only unpaid invoices can be deleted');
        }

        await Invoice.deleteOne({ _id: id });

        sendSuccess(res, 200, 'Invoice deleted successfully');
    } catch (error) {
        sendError(res, 500, error.message);
    }
};
exports.getMyChildInvoices = async (req, res) => {
    try {
        const { schoolId } = req.user;
        
        const students = await Student.find({
            schoolId,
            $or: [
                { parentId: req.user._id },
                { parentPhone: req.user.phone }
            ]
        });

        const studentIds = students.map(s => s._id);

        const invoices = await Invoice.find({
            schoolId,
            studentId: { $in: studentIds }
        })
        .populate('studentId', 'name rollNumber class section')
        .sort({ issuedDate: -1 });

        sendSuccess(res, 200, 'Child invoices fetched successfully', invoices);
    } catch (error) {
        sendError(res, 500, error.message);
    }
};
