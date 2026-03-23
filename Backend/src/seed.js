require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const School = require('./models/school.model');
const User = require('./models/user.model');
const Student = require('./models/student.model');
const Fee = require('./models/fee.model');
const Attendance = require('./models/attendance.model');

const seedData = async () => {
    try {
        // 1. Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to MongoDB...');

        // 2. Clear existing demo data
        const demoSchool = await School.findOne({ name: "Demo School" });
        if (demoSchool) {
            console.log('Cleaning existing demo data...');
            await Attendance.deleteMany({ schoolId: demoSchool._id });
            await Fee.deleteMany({ schoolId: demoSchool._id });
            await Student.deleteMany({ schoolId: demoSchool._id });
            await User.deleteMany({ schoolId: demoSchool._id });
            await School.deleteOne({ _id: demoSchool._id });
        }

        // 3. Create Demo School
        const school = await School.create({
            name: "Demo School",
            email: "demo@educore.pk",
            phone: "03001234567",
            address: "Model Town, Lahore",
            plan: "growth"
        });
        console.log('Demo School created.');

        // 4. Create Users
        const users = [
            { name: "Ali Raza", email: "admin@demo.com", role: "admin", password: "demo1234", schoolId: school._id },
            { name: "Sara Khan", email: "teacher@demo.com", role: "teacher", password: "demo1234", schoolId: school._id },
            { name: "Ahmed Malik", email: "parent@demo.com", role: "parent", password: "demo1234", schoolId: school._id }
        ];

        // Using create directly as User model has pre-save hook for hashing
        const createdUsers = await User.create(users);
        const adminUser = createdUsers.find(u => u.role === 'admin');
        const teacherUser = createdUsers.find(u => u.role === 'teacher');
        const parentUser = createdUsers.find(u => u.role === 'parent');
        console.log('Users created.');

        // 5. Create 5 Students
        const studentsData = [
            { name: "Zain Malik", rollNumber: "001", class: "5", section: "A", gender: "male", parentPhone: "03001111111", parentId: parentUser._id, schoolId: school._id },
            { name: "Hira Fatima", rollNumber: "002", class: "5", section: "A", gender: "female", parentPhone: "03002222222", schoolId: school._id },
            { name: "Omar Siddiqui", rollNumber: "003", class: "6", section: "B", gender: "male", parentPhone: "03003333333", schoolId: school._id },
            { name: "Ayesha Tariq", rollNumber: "004", class: "6", section: "B", gender: "female", parentPhone: "03004444444", schoolId: school._id },
            { name: "Bilal Ahmed", rollNumber: "005", class: "7", section: "A", gender: "male", parentPhone: "03005555555", schoolId: school._id }
        ];

        const createdStudents = await Student.create(studentsData);
        console.log('Students created.');

        // 6. Create Fee Records
        const currentMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-03"
        const lastDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
        
        const feesData = createdStudents.map(student => ({
            schoolId: school._id,
            studentId: student._id,
            amount: 5000,
            month: currentMonth,
            dueDate: lastDayOfMonth,
            status: 'unpaid'
        }));

        await Fee.create(feesData);
        console.log('Fee records created.');

        // 7. Create Attendance Records
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendanceData = [
            { schoolId: school._id, studentId: createdStudents[0]._id, teacherId: teacherUser._id, date: today, status: 'present' },
            { schoolId: school._id, studentId: createdStudents[1]._id, teacherId: teacherUser._id, date: today, status: 'present' },
            { schoolId: school._id, studentId: createdStudents[2]._id, teacherId: teacherUser._id, date: today, status: 'absent' }
        ];

        await Attendance.create(attendanceData);
        console.log('Attendance records created.');

        // 8. Summary
        console.log("\n✅ Seed complete!");
        console.log("Admin: admin@demo.com / demo1234");
        console.log("Teacher: teacher@demo.com / demo1234");
        console.log("Parent: parent@demo.com / demo1234\n");

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seed failed:', error.message);
        process.exit(1);
    }
};

seedData();
