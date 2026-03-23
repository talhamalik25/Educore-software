const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: 'f:/programming/EduCore/Backend/.env' });

const User = require('f:/programming/EduCore/Backend/src/models/user.model');

const checkSuperAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to DB');
        
        const email = 'superadmin@educore.test';
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            console.log('Error: Superadmin user NOT found in database.');
            return;
        }
        
        console.log('User found:', user.email);
        console.log('Role:', user.role);
        console.log('Is Active:', user.isActive);
        
        const isMatch = await bcrypt.compare('password123', user.password);
        console.log('Password "password123" matches:', isMatch);
        
        if (!isMatch) {
            console.log('Hashing new password...');
            user.password = 'password123';
            await user.save();
            console.log('Password re-hashed and saved.');
            
            const reUser = await User.findOne({ email }).select('+password');
            const reMatch = await bcrypt.compare('password123', reUser.password);
            console.log('Second match check:', reMatch);
        }
        
    } catch (err) {
        console.error('Diagnostic error:', err);
    } finally {
        mongoose.disconnect();
    }
};

checkSuperAdmin();
