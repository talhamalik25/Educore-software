const User = require('../models/user.model');
const School = require('../models/school.model');
const jwt = require('jsonwebtoken');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// @desc    Register first admin for a school
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    try {
        const { name, email, password, phone, schoolId } = req.body;

        // Check if school exists
        const school = await School.findById(schoolId);
        if (!school) {
            return sendError(res, 404, 'School not found.');
        }

        // Check if user already exists in this school
        const existingUser = await User.findOne({ email, schoolId });
        if (existingUser) {
            return sendError(res, 400, 'User with this email already exists.');
        }

        const user = await User.create({
            schoolId,
            name,
            email,
            password,
            phone,
            role: 'admin',
        });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '7d'
        });

        const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '30d'
        });
        user.refreshToken = refreshToken;
        await user.save();

        return sendSuccess(res, 201, 'Registration successful', {
            token,
            refreshToken,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                schoolId: user.schoolId,
            },
        });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return sendError(res, 400, 'Please provide email and password.');
        }

        // Find user with password
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return sendError(res, 401, 'Invalid credentials.');
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return sendError(res, 401, 'Invalid credentials.');
        }

        if (!user.isActive) {
            return sendError(res, 401, 'Your account has been deactivated.');
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '7d'
        });

        const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '30d'
        });
        user.refreshToken = refreshToken;
        await user.save();

        return sendSuccess(res, 200, 'Login successful', {
            token,
            refreshToken,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                schoolId: user.schoolId,
            },
        });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Register a new school + its first admin (public onboarding)
// @route   POST /api/auth/register-school
// @access  Public (Secret required)
const registerSchool = async (req, res) => {
    try {
        const SUPERADMIN_SECRET = process.env.SUPERADMIN_SECRET;
        if (req.body.superadminSecret !== SUPERADMIN_SECRET) {
            return sendError(res, 403, 'Unauthorized. Contact EduCore support to register your school.');
        }

        console.log('🚀 Registration started:', req.body.email);
        const {
            schoolName, schoolEmail, schoolPhone, schoolAddress, plan,
            name, email, password, phone,
        } = req.body;

        // Validate required fields
        if (!schoolName || !schoolEmail || !schoolPhone || !schoolAddress ||
            !name || !email || !password) {
            console.log('❌ Missing fields');
            return sendError(res, 400, 'All required fields must be provided.');
        }

        // Check if school email already taken
        const existingSchool = await School.findOne({ email: schoolEmail });
        if (existingSchool) {
            console.log('❌ School email exists');
            return sendError(res, 400, 'A school with this email already exists.');
        }

        // Check if user email already taken
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('❌ User email exists');
            return sendError(res, 400, 'A user with this email already exists.');
        }

        // Check founding member (first 20 schools)
        const schoolCount = await School.countDocuments();
        const isFoundingMember = schoolCount < 20;

        // Create school
        console.log('📝 Creating school...');
        const school = await School.create({
            name: schoolName,
            email: schoolEmail,
            phone: schoolPhone,
            address: schoolAddress,
            plan: plan || 'starter',
            isFoundingMember,
        });

        // Create admin user linked to the new school
        console.log('📝 Creating admin user for school:', school._id);
        const user = await User.create({
            schoolId: school._id,
            name,
            email,
            password,
            phone,
            role: 'admin',
        });

        console.log('✅ Registration successful:', user.email);
        
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '7d'
        });

        const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '30d'
        });
        user.refreshToken = refreshToken;
        await user.save();

        return sendSuccess(res, 201, 'School registered successfully', {
            token,
            refreshToken,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                schoolId: user.schoolId,
            },
            school: {
                _id: school._id,
                name: school.name,
                plan: school.plan,
            },
        });

    } catch (error) {
        console.error('❌ Registration error:', error);
        return sendError(res, 500, error.message || 'Registration failed');
    }
};

// @desc    Get logged in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        return sendSuccess(res, 200, 'User profile', { user: req.user });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refresh = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(401).json({ message: 'No refresh token' });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (!user || user.refreshToken !== refreshToken) {
            return res.status(403).json({ message: 'Invalid refresh token' });
        }

        const newToken = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }
        );

        res.json({ token: newToken });
    } catch (err) {
        return res.status(403).json({ message: 'Refresh token expired or invalid, please login again' });
    }
};

module.exports = { register, login, registerSchool, getMe, refresh };
