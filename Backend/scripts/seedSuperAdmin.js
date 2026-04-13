require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/user.model');
const connectDB = require('../src/config/db');

const seedSuperAdmin = async () => {
    try {
        await connectDB();

        const email = 'superadmin@educore.pk';
        const existingSuperAdmin = await User.findOne({ email, role: 'superadmin' });

        if (existingSuperAdmin) {
            console.log('ℹ️ Super admin already exists.');
            process.exit(0);
        }

        const superAdminData = {
            name: 'Platform Administrator',
            email: email,
            password: 'SuperAdmin@123', // Will be hashed by userSchema.pre('save')
            role: 'superadmin',
            schoolId: null, // Super admins aren't tied to a specific school
            isActive: true
        };

        // Note: schoolId is required in the schema, I need to check if that's true
        // and if I need to adjust it for superadmins.
        
        await User.create(superAdminData);
        console.log('✅ Super admin created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding super admin:', error.message);
        process.exit(1);
    }
};

seedSuperAdmin();
