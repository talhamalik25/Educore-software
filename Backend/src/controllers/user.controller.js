const User = require('../models/user.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// @desc    Create user (teacher/parent) under a school
// @route   POST /api/users
// @access  Admin
const createUser = async (req, res) => {
    try {
        const { name, email, password, phone, role } = req.body;

        const existingUser = await User.findOne({ email, schoolId: req.user.schoolId });
        if (existingUser) {
            return sendError(res, 400, 'User with this email already exists in this school.');
        }

        const user = await User.create({
            schoolId: req.user.schoolId,
            name,
            email,
            password,
            phone,
            role: role || 'teacher',
        });

        return sendSuccess(res, 201, 'User created successfully', {
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Get all users in a school
// @route   GET /api/users
// @access  Admin
const getUsers = async (req, res) => {
    try {
        const users = await User.find({ schoolId: req.user.schoolId }).select('-password');
        return sendSuccess(res, 200, 'Users fetched', { users });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Admin
const getUser = async (req, res) => {
    try {
        const user = await User.findOne({
            _id: req.params.id,
            schoolId: req.user.schoolId,
        }).select('-password');

        if (!user) return sendError(res, 404, 'User not found.');
        return sendSuccess(res, 200, 'User fetched', { user });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Admin
const updateUser = async (req, res) => {
    try {
        // Don't allow password update through this route
        delete req.body.password;

        const user = await User.findOneAndUpdate(
            { _id: req.params.id, schoolId: req.user.schoolId },
            req.body,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) return sendError(res, 404, 'User not found.');
        return sendSuccess(res, 200, 'User updated', { user });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Delete (deactivate) user
// @route   DELETE /api/users/:id
// @access  Admin
const deleteUser = async (req, res) => {
    try {
        const user = await User.findOneAndUpdate(
            { _id: req.params.id, schoolId: req.user.schoolId },
            { isActive: false },
            { new: true }
        );
        if (!user) return sendError(res, 404, 'User not found.');
        return sendSuccess(res, 200, 'User deactivated successfully');
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

module.exports = { createUser, getUsers, getUser, updateUser, deleteUser };
