const School = require('../models/school.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// @desc    Create a new school
// @route   POST /api/schools
// @access  Superadmin only
const createSchool = async (req, res) => {
    try {
        const { name, email, phone, address, plan } = req.body;

        const existingSchool = await School.findOne({ email });
        if (existingSchool) {
            return sendError(res, 400, 'School with this email already exists.');
        }

        // Check founding member (first 20 schools)
        const schoolCount = await School.countDocuments();
        const isFoundingMember = schoolCount < 20;

        const school = await School.create({
            name,
            email,
            phone,
            address,
            plan: plan || 'starter',
            isFoundingMember,
        });

        return sendSuccess(res, 201, 'School created successfully', { school });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Get all schools
// @route   GET /api/schools
// @access  Superadmin only
const getAllSchools = async (req, res) => {
    try {
        const schools = await School.find().sort({ createdAt: -1 });
        return sendSuccess(res, 200, 'Schools fetched', { schools });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Get single school
// @route   GET /api/schools/:id
// @access  Superadmin / Admin of that school
const getSchool = async (req, res) => {
    try {
        const school = await School.findById(req.params.id);
        if (!school) return sendError(res, 404, 'School not found.');
        return sendSuccess(res, 200, 'School fetched', { school });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Update school
// @route   PUT /api/schools/:id
// @access  Superadmin only
const updateSchool = async (req, res) => {
    try {
        const school = await School.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!school) return sendError(res, 404, 'School not found.');
        return sendSuccess(res, 200, 'School updated', { school });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

module.exports = { createSchool, getAllSchools, getSchool, updateSchool };
