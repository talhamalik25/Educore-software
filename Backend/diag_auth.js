const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./src/models/user.model');

const diag = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to DB');

        const email = 'superadmin@educore.test';
        const password = 'password123';

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            console.log('❌ User NOT found:', email);
            return;
        }

        console.log('✅ User found:', user.email);
        console.log('Hashed Password in DB:', user.password);

        const isMatch = await user.comparePassword(password);
        if (isMatch) {
            console.log('✅ Password matches!');
        } else {
            console.log('❌ Password DOES NOT match!');
            
            // Re-hash and test
            const salt = await bcrypt.genSalt(12);
            const reHash = await bcrypt.hash(password, salt);
            console.log('Generated hash for password123:', reHash);
            const manualMatch = await bcrypt.compare(password, user.password);
            console.log('Manual compare match:', manualMatch);
        }

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
};

diag();
