const mongoose = require('mongoose');
const User = require('./src/models/user.model.js');
const School = require('./src/models/school.model.js');
require('dotenv').config();

const MONGO_URL = process.env.MONGO_URL || 'mongodb+srv://mtmaliktalha2005_db_user:zu4j8l2omh1YU2Rv@cluster0.vmq3bht.mongodb.net/educore';

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URL);
    console.log("Connected.");

    const schoolData = {
      name: "Antigravity Academy",
      email: "contact@antigravity.edu",
      phone: "1234567890",
      address: "123 Space Colony, Mars",
      plan: "pro",
    };

    const adminData = {
      name: "Talha Malik",
      email: "talha.admin@educore.test",
      password: "password123",
      role: "admin",
    };

    // Check if school already exists
    let school = await School.findOne({ email: schoolData.email });
    if (school) {
        console.log("School already exists. Skipping school creation.");
    } else {
        school = await School.create(schoolData);
        console.log(`✅ School created: ${school.name} (${school._id})`);
    }

    // Check if admin already exists
    let user = await User.findOne({ email: adminData.email });
    if (user) {
        console.log("Admin user already exists. Updating password...");
        user.password = adminData.password;
        user.schoolId = school._id;
        await user.save();
        console.log("✅ Admin user updated.");
    } else {
        user = await User.create({
            ...adminData,
            schoolId: school._id,
        });
        console.log(`✅ Admin user created: ${user.email}`);
    }

  } catch (err) {
    console.error("FAILURE:", err.message);
  } finally {
    console.log("Disconnecting...");
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
