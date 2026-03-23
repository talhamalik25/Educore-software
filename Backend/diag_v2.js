const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URL = "mongodb+srv://mtmaliktalha2005_db_user:zu4j8l2omh1YU2Rv@cluster0.vmq3bht.mongodb.net/educore";
const USER_MODEL_PATH = "f:/programming/EduCore/Backend/src/models/user.model.js";

const User = require(USER_MODEL_PATH);

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URL);
    console.log("Connected.");

    const email = "superadmin@educore.test";
    console.log(`Checking user: ${email}`);
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      console.log("System Status: SUPERADMIN_NOT_FOUND");
      return;
    }

    console.log("User found. Details:");
    console.log(`- Email: ${user.email}`);
    console.log(`- Role: ${user.role}`);
    console.log(`- Active: ${user.isActive}`);
    
    const isMatch = await bcrypt.compare("password123", user.password);
    console.log(`- Password match (password123): ${isMatch}`);

    if (!isMatch) {
       console.log("Action: Fixing password hash...");
       user.password = "password123";
       await user.save();
       console.log("Result: Password updated and hashed.");
    }
    
  } catch (err) {
    console.error("DIAGNOSTIC_FAILURE:", err.message);
    if (err.stack) console.error(err.stack);
  } finally {
    console.log("Disconnecting...");
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
