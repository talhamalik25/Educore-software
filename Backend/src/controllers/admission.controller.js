const Admission = require('../models/admission.model');
const Student = require('../models/student.model');
const User = require('../models/user.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { cloudinary } = require('../config/cloudinary');

// @desc    Create new admission/inquiry
// @route   POST /api/admissions
// @access  Admin
const createAdmission = async (req, res) => {
    try {
        const admission = await Admission.create({
            ...req.body,
            schoolId: req.user.schoolId,
            createdBy: req.user._id,
        });
        return sendSuccess(res, 201, 'Admission created successfully', { admission });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Get all admissions with filters
// @route   GET /api/admissions
// @access  Admin
const getAllAdmissions = async (req, res) => {
    try {
        const filter = { schoolId: req.user.schoolId };
        if (req.query.status) filter.status = req.query.status;
        if (req.query.class) filter.applyingForClass = req.query.class;
        if (req.query.search) {
            const search = req.query.search;
            filter.$or = [
                { applicantName: { $regex: search, $options: 'i' } },
                { parentName: { $regex: search, $options: 'i' } },
                { applyingForClass: { $regex: search, $options: 'i' } },
            ];
        }

        const admissions = await Admission.find(filter).sort({ createdAt: -1 });
        return sendSuccess(res, 200, 'Admissions fetched', { admissions });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Get admission by ID
// @route   GET /api/admissions/:id
// @access  Admin
const getAdmissionById = async (req, res) => {
    try {
        const admission = await Admission.findOne({
            _id: req.params.id,
            schoolId: req.user.schoolId,
        });
        if (!admission) return sendError(res, 404, 'Admission not found.');
        return sendSuccess(res, 200, 'Admission fetched', { admission });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Update admission
// @route   PUT /api/admissions/:id
// @access  Admin
const updateAdmission = async (req, res) => {
    try {
        const updateData = { ...req.body };
        if (updateData.status === 'admitted' && !updateData.admissionDate) {
            updateData.admissionDate = new Date();
        }

        const admission = await Admission.findOneAndUpdate(
            { _id: req.params.id, schoolId: req.user.schoolId },
            updateData,
            { new: true, runValidators: true }
        );
        if (!admission) return sendError(res, 404, 'Admission not found.');
        return sendSuccess(res, 200, 'Admission updated', { admission });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Upload document to admission
// @route   POST /api/admissions/:id/documents
// @access  Admin
const uploadDocument = async (req, res) => {
    try {
        const admission = await Admission.findOne({
            _id: req.params.id,
            schoolId: req.user.schoolId,
        });
        if (!admission) return sendError(res, 404, 'Admission not found.');

        if (!req.file) return sendError(res, 400, 'No file uploaded.');

        admission.documents.push({
            name: req.file.originalname || req.body.name || 'Document',
            url: req.file.path,
            publicId: req.file.filename,
        });

        await admission.save();
        return sendSuccess(res, 200, 'Document uploaded', { admission });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Delete document from admission
// @route   DELETE /api/admissions/:id/documents/:docId
// @access  Admin
const deleteDocument = async (req, res) => {
    try {
        const admission = await Admission.findOne({
            _id: req.params.id,
            schoolId: req.user.schoolId,
        });
        if (!admission) return sendError(res, 404, 'Admission not found.');

        const doc = admission.documents.id(req.params.docId);
        if (!doc) return sendError(res, 404, 'Document not found.');

        // Delete from Cloudinary
        if (doc.publicId) {
            try {
                await cloudinary.uploader.destroy(doc.publicId);
            } catch (e) {
                console.error('Cloudinary delete error:', e.message);
            }
        }

        admission.documents.pull({ _id: req.params.docId });
        await admission.save();
        return sendSuccess(res, 200, 'Document deleted', { admission });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Convert admitted application to student
// @route   POST /api/admissions/:id/convert
// @access  Admin
const convertToStudent = async (req, res) => {
    try {
        const admission = await Admission.findOne({
            _id: req.params.id,
            schoolId: req.user.schoolId,
        });
        if (!admission) return sendError(res, 404, 'Admission not found.');
        if (admission.status !== 'admitted') return sendError(res, 400, 'Only admitted applications can be converted.');
        if (admission.convertedStudentId) return sendError(res, 400, 'This application has already been converted to a student.');

        // Find parent if exists
        const parent = await User.findOne({ phone: admission.parentPhone, role: 'parent' });

        const student = await Student.create({
            schoolId: req.user.schoolId,
            name: admission.applicantName,
            rollNumber: admission.assignedRollNo || `ADM-${Date.now()}`,
            class: admission.assignedClass || admission.applyingForClass,
            section: admission.assignedSection || 'A',
            dateOfBirth: admission.dateOfBirth,
            gender: admission.gender,
            parentPhone: admission.parentPhone,
            parentId: parent ? parent._id : null,
        });

        admission.convertedStudentId = student._id;
        await admission.save();

        return sendSuccess(res, 201, 'Student record created from admission', { student, admission });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Get admission statistics
// @route   GET /api/admissions/stats
// @access  Admin
const getAdmissionStats = async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [statusCounts, thisMonth, totalConverted, total] = await Promise.all([
            Admission.aggregate([
                { $match: { schoolId: schoolId } },
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            Admission.countDocuments({ schoolId, createdAt: { $gte: startOfMonth } }),
            Admission.countDocuments({ schoolId, convertedStudentId: { $ne: null } }),
            Admission.countDocuments({ schoolId }),
        ]);

        const byStatus = {};
        statusCounts.forEach(s => { byStatus[s._id] = s.count; });

        return sendSuccess(res, 200, 'Admission stats fetched', {
            total,
            thisMonth,
            converted: totalConverted,
            conversionRate: total > 0 ? Math.round((totalConverted / total) * 100) : 0,
            pending: byStatus.under_review || 0,
            inquiry: byStatus.inquiry || 0,
            applied: byStatus.applied || 0,
            under_review: byStatus.under_review || 0,
            waitlisted: byStatus.waitlisted || 0,
            admitted: byStatus.admitted || 0,
            rejected: byStatus.rejected || 0,
        });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Delete admission
// @route   DELETE /api/admissions/:id
// @access  Admin
const deleteAdmission = async (req, res) => {
    try {
        const admission = await Admission.findOneAndDelete({
            _id: req.params.id,
            schoolId: req.user.schoolId,
        });
        if (!admission) return sendError(res, 404, 'Admission not found.');
        return sendSuccess(res, 200, 'Admission deleted successfully');
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

module.exports = {
    createAdmission,
    getAllAdmissions,
    getAdmissionById,
    updateAdmission,
    uploadDocument,
    deleteDocument,
    convertToStudent,
    getAdmissionStats,
    deleteAdmission,
};
