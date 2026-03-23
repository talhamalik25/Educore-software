const User = require('../models/user.model');
const School = require('../models/school.model');
const Student = require('../models/student.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// @desc    Get all schools with student counts
// @route   GET /api/superadmin/schools
// @access  Private (SuperAdmin)
const getAllSchools = async (req, res) => {
    try {
        const schools = await School.find().sort({ createdAt: -1 });
        
        const schoolsWithStats = await Promise.all(schools.map(async (school) => {
            const studentCount = await Student.countDocuments({ schoolId: school._id });
            return {
                ...school._doc,
                studentCount
            };
        }));

        return sendSuccess(res, 200, 'Schools fetched successfully', { schools: schoolsWithStats });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Create a school and its first admin admin
// @route   POST /api/superadmin/schools
// @access  Private (SuperAdmin)
const createSchoolWithAdmin = async (req, res) => {
    try {
        const { 
            schoolName, schoolEmail, schoolPhone, schoolAddress, plan,
            adminName, adminEmail, adminPassword 
        } = req.body;

        if (!schoolName || !schoolEmail || !schoolPhone || !schoolAddress || !adminName || !adminEmail || !adminPassword) {
            return sendError(res, 400, 'All fields are required.');
        }

        // Check if school email already taken
        const existingSchool = await School.findOne({ email: schoolEmail });
        if (existingSchool) {
            return sendError(res, 400, 'A school with this email already exists.');
        }

        // Check if admin email already taken
        const existingUser = await User.findOne({ email: adminEmail });
        if (existingUser) {
            return sendError(res, 400, 'A user with this email already exists.');
        }

        // Create school
        const school = await School.create({
            name: schoolName,
            email: schoolEmail,
            phone: schoolPhone,
            address: schoolAddress,
            plan: plan || 'starter',
        });

        // Create admin user
        await User.create({
            schoolId: school._id,
            name: adminName,
            email: adminEmail,
            password: adminPassword,
            role: 'admin',
        });

        return sendSuccess(res, 201, 'School and admin created successfully', {
            school,
            admin: { name: adminName, email: adminEmail },
            tempPassword: adminPassword,
        });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Update school details
// @route   PUT /api/superadmin/schools/:id
// @access  Private (SuperAdmin)
const updateSchool = async (req, res) => {
    try {
        const { name, email, phone, address, plan } = req.body;
        
        const school = await School.findByIdAndUpdate(
            req.params.id,
            { name, email, phone, address, plan },
            { new: true, runValidators: true }
        );

        if (!school) {
            return sendError(res, 404, 'School not found.');
        }

        return sendSuccess(res, 200, 'School updated successfully', { school });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Toggle school status
// @route   PATCH /api/superadmin/schools/:id/toggle
// @access  Private (SuperAdmin)
const toggleSchoolStatus = async (req, res) => {
    try {
        const school = await School.findById(req.params.id);
        if (!school) {
            return sendError(res, 404, 'School not found.');
        }

        school.isActive = !school.isActive;
        await school.save();

        // Sync user status
        await User.updateMany({ schoolId: school._id }, { isActive: school.isActive });

        return sendSuccess(res, 200, `School ${school.isActive ? 'activated' : 'deactivated'} successfully`, { school });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Get aggregate stats for SuperAdmin
// @route   GET /api/superadmin/stats
// @access  Private (SuperAdmin)
const getSchoolStats = async (req, res) => {
    try {
        const totalSchools = await School.countDocuments();
        const activeSchools = await School.countDocuments({ isActive: true });
        const totalStudents = await Student.countDocuments();
        
        const schools = await School.find();
        const planBreakdown = { starter: 0, growth: 0, pro: 0 };
        
        schools.forEach(school => {
            if (planBreakdown[school.plan] !== undefined) {
                planBreakdown[school.plan]++;
            }
        });

        return sendSuccess(res, 200, 'Stats fetched successfully', {
            totalSchools,
            activeSchools,
            totalStudents,
            planBreakdown
        });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

module.exports = {
    getAllSchools,
    createSchoolWithAdmin,
    updateSchool,
    toggleSchoolStatus,
    getSchoolStats
};
