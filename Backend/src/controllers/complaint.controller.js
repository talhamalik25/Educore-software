const Complaint = require('../models/complaint.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// @desc    Submit a complaint or suggestion
// @route   POST /api/complaints
// @access  Admin, Teacher, Parent
const submitComplaint = async (req, res) => {
    try {
        const { category, title, description, isAnonymous, priority } = req.body;

        const complaint = await Complaint.create({
            schoolId: req.user.schoolId,
            submittedBy: req.user._id,
            role: req.user.role,
            category,
            title,
            description,
            isAnonymous: isAnonymous || false,
            priority: priority || 'medium',
        });

        return sendSuccess(res, 201, 'Complaint submitted successfully', { complaint });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Get logged in user's complaints
// @route   GET /api/complaints/my
// @access  Protected
const getMyComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find({
            submittedBy: req.user._id,
            schoolId: req.user.schoolId,
        }).sort({ createdAt: -1 });

        return sendSuccess(res, 200, 'My complaints fetched', { complaints });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Get all complaints (Admin only)
// @route   GET /api/complaints
// @access  Admin
const getAllComplaints = async (req, res) => {
    try {
        const { status, category, priority } = req.query;
        const filter = { schoolId: req.user.schoolId };

        if (status) filter.status = status;
        if (category) filter.category = category;
        if (priority) filter.priority = priority;

        let complaints = await Complaint.find(filter)
            .populate('submittedBy', 'name email')
            .sort({ createdAt: -1 });

        // Handle anonymity
        complaints = complaints.map(complaint => {
            const c = complaint.toObject();
            if (c.isAnonymous) {
                delete c.submittedBy;
            }
            return c;
        });

        return sendSuccess(res, 200, 'All complaints fetched', { complaints });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Reply to a complaint (Admin only)
// @route   PUT /api/complaints/:id/reply
// @access  Admin
const replyToComplaint = async (req, res) => {
    try {
        const { adminReply } = req.body;
        if (!adminReply) return sendError(res, 400, 'Reply content is required');

        const complaint = await Complaint.findOneAndUpdate(
            { _id: req.params.id, schoolId: req.user.schoolId },
            {
                adminReply,
                repliedAt: new Date(),
                repliedBy: req.user._id,
                status: 'in_progress',
            },
            { new: true }
        );

        if (!complaint) return sendError(res, 404, 'Complaint not found');

        return sendSuccess(res, 200, 'Reply added successfully', { complaint });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Update complaint status (Admin only)
// @route   PUT /api/complaints/:id/status
// @access  Admin
const updateComplaintStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) return sendError(res, 400, 'Status is required');

        const updateData = { status };
        if (status === 'resolved') {
            updateData.resolvedAt = new Date();
        }

        const complaint = await Complaint.findOneAndUpdate(
            { _id: req.params.id, schoolId: req.user.schoolId },
            updateData,
            { new: true }
        );

        if (!complaint) return sendError(res, 404, 'Complaint not found');

        return sendSuccess(res, 200, `Status updated to ${status}`, { complaint });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Delete a complaint (Admin only)
// @route   DELETE /api/complaints/:id
// @access  Admin
const deleteComplaint = async (req, res) => {
    try {
        const complaint = await Complaint.findOneAndDelete({
            _id: req.params.id,
            schoolId: req.user.schoolId,
        });

        if (!complaint) return sendError(res, 404, 'Complaint not found');

        return sendSuccess(res, 200, 'Complaint deleted successfully');
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Get complaint analytics (Admin only)
// @route   GET /api/complaints/stats
// @access  Admin
const getComplaintStats = async (req, res) => {
    try {
        const schoolId = req.user.schoolId;

        const statsByStatus = await Complaint.aggregate([
            { $match: { schoolId } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const statsByCategory = await Complaint.aggregate([
            { $match: { schoolId } },
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        // Calculate average resolution time for resolved complaints
        const resolvedComplaints = await Complaint.find({
            schoolId,
            status: 'resolved',
            resolvedAt: { $exists: true },
        });

        let avgResolutionTime = 0;
        if (resolvedComplaints.length > 0) {
            const totalTime = resolvedComplaints.reduce((acc, curr) => {
                const diff = new Date(curr.resolvedAt) - new Date(curr.createdAt);
                return acc + diff;
            }, 0);
            avgResolutionTime = totalTime / resolvedComplaints.length / (1000 * 60 * 60); // In hours
        }

        return sendSuccess(res, 200, 'Complaint stats fetched', {
            byStatus: statsByStatus,
            byCategory: statsByCategory,
            avgResolutionTimeHours: Math.round(avgResolutionTime * 10) / 10,
        });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

module.exports = {
    submitComplaint,
    getMyComplaints,
    getAllComplaints,
    replyToComplaint,
    updateComplaintStatus,
    deleteComplaint,
    getComplaintStats,
};
