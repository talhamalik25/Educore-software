const Student = require('../models/student.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// @desc    Create student
// @route   POST /api/students
// @access  Admin
const createStudent = async (req, res) => {
    try {
        const { name, rollNumber, class: studentClass, section, dateOfBirth, gender, parentPhone } = req.body;

        const existing = await Student.findOne({ rollNumber, schoolId: req.user.schoolId });
        if (existing) {
            return sendError(res, 400, 'Student with this roll number already exists.');
        }

        const student = await Student.create({
            schoolId: req.user.schoolId,
            name,
            rollNumber,
            class: studentClass,
            section,
            dateOfBirth,
            gender,
            parentPhone,
        });

        return sendSuccess(res, 201, 'Student created successfully', { student });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Get all students in school
// @route   GET /api/students
// @access  Admin, Teacher
const getStudents = async (req, res) => {
    try {
        const filter = { schoolId: req.user.schoolId, isActive: true };

        // If parent, only show their students
        if (req.user.role === 'parent') {
            filter.parentId = req.user._id;
        }

        // Optional filter by class
        if (req.query.class) filter.class = req.query.class;
        if (req.query.section) filter.section = req.query.section;

        const students = await Student.find(filter).sort({ class: 1, rollNumber: 1 });
        return sendSuccess(res, 200, 'Students fetched', { students });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Admin, Teacher
const getStudent = async (req, res) => {
    try {
        const student = await Student.findOne({
            _id: req.params.id,
            schoolId: req.user.schoolId,
        });
        if (!student) return sendError(res, 404, 'Student not found.');
        return sendSuccess(res, 200, 'Student fetched', { student });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Admin
const updateStudent = async (req, res) => {
    try {
        const student = await Student.findOneAndUpdate(
            { _id: req.params.id, schoolId: req.user.schoolId },
            req.body,
            { new: true, runValidators: true }
        );
        if (!student) return sendError(res, 404, 'Student not found.');
        return sendSuccess(res, 200, 'Student updated', { student });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Delete (deactivate) student
// @route   DELETE /api/students/:id
// @access  Admin
const deleteStudent = async (req, res) => {
    try {
        const student = await Student.findOneAndUpdate(
            { _id: req.params.id, schoolId: req.user.schoolId },
            { isActive: false },
            { new: true }
        );
        if (!student) return sendError(res, 404, 'Student not found.');
        return sendSuccess(res, 200, 'Student deactivated successfully');
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

module.exports = { createStudent, getStudents, getStudent, updateStudent, deleteStudent };
