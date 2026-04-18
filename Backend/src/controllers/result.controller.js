const Result = require('../models/result.model');
const Student = require('../models/student.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// @desc    Add a new result
// @route   POST /api/results
// @access  Teacher, Admin
const addResult = async (req, res) => {
    try {
        const { studentId, class: rClass, section, subject, examType, totalMarks, obtainedMarks, remarks, examDate } = req.body;

        if (obtainedMarks > totalMarks) {
            return sendError(res, 400, 'Obtained marks cannot exceed total marks');
        }

        const result = await Result.create({
            schoolId: req.user.schoolId,
            studentId,
            class: rClass,
            section,
            subject,
            examType,
            totalMarks,
            obtainedMarks,
            remarks,
            teacherId: req.user._id,
            examDate,
        });

        return sendSuccess(res, 201, 'Result added successfully', { result });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Update a result
// @route   PUT /api/results/:id
// @access  Teacher, Admin
const updateResult = async (req, res) => {
    try {
        const { totalMarks, obtainedMarks } = req.body;

        if (obtainedMarks !== undefined && totalMarks !== undefined && obtainedMarks > totalMarks) {
            return sendError(res, 400, 'Obtained marks cannot exceed total marks');
        }

        const result = await Result.findOneAndUpdate(
            { _id: req.params.id, schoolId: req.user.schoolId },
            req.body,
            { new: true, runValidators: true }
        );

        if (!result) {
            return sendError(res, 404, 'Result not found');
        }

        // Trigger pre-save hook for grade recalculation if marks changed
        if (obtainedMarks !== undefined || totalMarks !== undefined) {
            await result.save();
        }

        return sendSuccess(res, 200, 'Result updated successfully', { result });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Delete a result
// @route   DELETE /api/results/:id
// @access  Admin
const deleteResult = async (req, res) => {
    try {
        const result = await Result.findOneAndDelete({ _id: req.params.id, schoolId: req.user.schoolId });

        if (!result) {
            return sendError(res, 404, 'Result not found');
        }

        return sendSuccess(res, 200, 'Result deleted successfully');
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Get all results for a student
// @route   GET /api/results/student/:studentId
// @access  Admin, Teacher, Parent
const getResultsByStudent = async (req, res) => {
    try {
        const results = await Result.find({ 
            studentId: req.params.studentId, 
            schoolId: req.user.schoolId 
        }).populate('studentId', 'name rollNumber class section');

        return sendSuccess(res, 200, 'Results fetched successfully', { results });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Get results by class and section
// @route   GET /api/results/class
// @access  Admin, Teacher
const getResultsByClass = async (req, res) => {
    try {
        const { class: rClass, section, examType } = req.query;

        if (!rClass || !section) {
            return sendError(res, 400, 'Class and section are required');
        }

        const filter = {
            schoolId: req.user.schoolId,
            class: rClass,
            section: section,
        };

        if (examType) {
            filter.examType = examType;
        }

        const results = await Result.find(filter).populate('studentId', 'name rollNumber');

        return sendSuccess(res, 200, 'Results fetched successfully', { results });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Get results for parent's linked student
// @route   GET /api/results/my
// @access  Parent
const getMyResults = async (req, res) => {
    try {
        // Find students linked to this parent
        const students = await Student.find({ parentId: req.user._id, schoolId: req.user.schoolId });
        
        if (!students || students.length === 0) {
            return sendSuccess(res, 200, 'No linked students found', { results: [] });
        }

        const studentIds = students.map(s => s._id);

        const results = await Result.find({
            studentId: { $in: studentIds },
            schoolId: req.user.schoolId
        }).populate('studentId', 'name rollNumber class section');

        return sendSuccess(res, 200, 'Results fetched successfully', { results });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Get dashboard stats for results
// @route   GET /api/results/stats
// @access  Admin, Teacher
const getResultStats = async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [resultsThisMonth, upcomingExams] = await Promise.all([
            Result.countDocuments({
                schoolId,
                createdAt: { $gte: firstDayOfMonth }
            }),
            Result.countDocuments({
                schoolId,
                examDate: { $gte: now }
            })
        ]);

        return sendSuccess(res, 200, 'Result stats fetched', {
            resultsThisMonth,
            upcomingExams
        });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

module.exports = {
    addResult,
    updateResult,
    deleteResult,
    getResultsByStudent,
    getResultsByClass,
    getMyResults,
    getResultStats,
};
