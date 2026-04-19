const User = require('../models/user.model');
const School = require('../models/school.model');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const sendEmail = require('../utils/sendEmail');
const admin = require('../config/firebaseAdmin');

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

        // ROLE MISMATCH CHECK
        if (req.body.role && req.body.role !== user.role) {
            return res.status(403).json({
                message: `This account is not registered as ${req.body.role}. Please select the correct role.`
            });
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
                schoolId: user.schoolId || null,
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

// @desc    Logout - clear refresh token from DB
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
        return sendSuccess(res, 200, 'Logged out successfully');
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

        return sendSuccess(res, 200, 'Token refreshed', { token: newToken });
    } catch (err) {
        return res.status(403).json({ message: 'Refresh token expired or invalid, please login again' });
    }
};

// @desc    Forgot password - send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return sendError(res, 400, 'Please provide your email.');

        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal if email exists or not
            return sendSuccess(res, 200, 'If this email exists, a reset link has been sent.');
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 min
        await user.save();

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0B1F1E; color: white; padding: 40px; border-radius: 16px;">
                <h2 style="color: #00A896; margin-bottom: 8px;">EduCore</h2>
                <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Password Reset Request</p>
                <hr style="border-color: #1a2e2d; margin: 24px 0;">
                <p style="font-size: 16px;">Hello <strong>${user.name}</strong>,</p>
                <p style="color: #aaa;">You requested a password reset. Click the button below to set a new password. This link will expire in <strong>30 minutes</strong>.</p>
                <div style="text-align: center; margin: 40px 0;">
                    <a href="${resetUrl}" style="background: #00A896; color: white; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">
                        Reset My Password
                    </a>
                </div>
                <p style="color: #555; font-size: 12px;">If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
                <hr style="border-color: #1a2e2d; margin: 24px 0;">
                <p style="color: #333; font-size: 11px;">EduCore — AI-Powered School Management System</p>
            </div>
        `;

        await sendEmail(user.email, 'Reset Your EduCore Password', html);

        return sendSuccess(res, 200, 'If this email exists, a reset link has been sent.');
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password || password.length < 6) {
            return sendError(res, 400, 'Password must be at least 6 characters.');
        }

        // Hash the token to compare with DB
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: new Date() },
        }).select('+password');

        if (!user) {
            return sendError(res, 400, 'Reset link is invalid or has expired.');
        }

        // Set new password
        user.password = password;
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        user.refreshToken = null; // force re-login on all devices
        await user.save();

        return sendSuccess(res, 200, 'Password reset successful. Please login with your new password.');
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Google OAuth login via Firebase token 
// @route   POST /api/auth/google 
// @access  Public 
const googleLogin = async (req, res) => { 
    try { 
        const { idToken } = req.body; 
        if (!idToken) return sendError(res, 400, 'Firebase ID token is required.'); 

        if (!admin.apps.length) {
            return sendError(res, 500, 'Firebase Admin is not configured on the server.');
        }
 
        // Verify token with Firebase Admin 
        const decoded = await admin.auth().verifyIdToken(idToken); 
        const { email, name, uid } = decoded; 
 
        if (!email) return sendError(res, 400, 'Google account has no email.'); 
 
        // Check if user exists 
        let user = await User.findOne({ email }); 
 
        if (!user) { 
            return sendError(res, 403, 'No EduCore account found for this Google email. Please contact your school admin.'); 
        } 
 
        if (!user.isActive) { 
            return sendError(res, 401, 'Your account has been deactivated.'); 
        } 
 
        // Issue tokens 
        const token = jwt.sign( 
            { id: user._id, role: user.role, schoolId: user.schoolId }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' } 
        ); 
 
        const refreshToken = jwt.sign( 
            { id: user._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '30d' } 
        ); 
 
        user.refreshToken = refreshToken; 
        await user.save(); 
 
        return sendSuccess(res, 200, 'Google login successful', { 
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
        if (error.code === 'auth/id-token-expired') { 
            return sendError(res, 401, 'Google session expired. Please try again.'); 
        } 
        return sendError(res, 500, error.message); 
    } 
}; 

module.exports = { register, login, registerSchool, getMe, refresh, logout, forgotPassword, resetPassword, googleLogin };
