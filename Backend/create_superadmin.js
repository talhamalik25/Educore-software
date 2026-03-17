const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./src/models/user.model');

const createSuperAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to DB');
        
        const superadminEmail = 'superadmin@educore.test';
        let superadmin = await User.findOne({ email: superadminEmail });
        
        if (superadmin) {
            console.log('Superadmin already exists:');
            console.log(`Email: ${superadmin.email}`);
            console.log('Password was set previously. If you forgot it, we can reset it.');
            
            // Optionally, reset the password for them to be sure
            superadmin.password = 'password123';
            await superadmin.save();
            console.log('Password reset to: password123');
        } else {
            console.log('Creating System School...');
            const School = require('./src/models/school.model');
            let systemSchool = await School.findOne({ email: 'system@educore.test' });
            if (!systemSchool) {
                systemSchool = await School.create({
                    name: 'System Administration',
                    email: 'system@educore.test',
                    phone: '0000000000',
                    address: 'System Address',
                    plan: 'pro',
                    isFoundingMember: true
                });
            }

            console.log('Creating superadmin...');
            superadmin = await User.create({
                name: 'System Superadmin',
                email: superadminEmail,
                password: 'password123',
                role: 'superadmin',
                schoolId: systemSchool._id,
                isActive: true
            });
            console.log('Superadmin created:');
            console.log(`Email: ${superadmin.email}`);
            console.log('Password: password123');
        }
        
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
};

createSuperAdmin();
