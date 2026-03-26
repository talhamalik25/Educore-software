require('dotenv').config();
const mongoose = require('mongoose');
const School = require('./models/school.model');
const User = require('./models/user.model');
const Student = require('./models/student.model');
const Fee = require('./models/fee.model');
const Attendance = require('./models/attendance.model');

const firstNames = ['Ali', 'Ahmed', 'Sara', 'Hira', 'Zain', 'Omar', 'Ayesha', 'Bilal', 'Fatima', 'Hamza', 'Usman', 'Tayyaba', 'Rayyan', 'Mustafa', 'Amna', 'Zahra', 'Hassan', 'Hussein', 'Maryam', 'Siddiq'];
const lastNames = ['Khan', 'Malik', 'Ahmed', 'Siddiqui', 'Tariq', 'Raza', 'Shah', 'Sheikh', 'Lodhi', 'Butt', 'Dar', 'Iqbal', 'Mirza', 'Gull', 'Abbas'];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomName = () => `${getRandom(firstNames)} ${getRandom(lastNames)}`;
const getRandomPhone = () => `03${Math.floor(100000000 + Math.random() * 900000000)}`;

const seedExtensive = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to MongoDB for extensive seeding...');

        const schools = await School.find();
        console.log(`Found ${schools.length} schools to seed.`);

        for (const school of schools) {
            try {
                console.log(`\n--- Seeding School: ${school.name} (${school._id}) ---`);

                // 1. Ensure at least one teacher exists
                let teacher = await User.findOne({ schoolId: school._id, role: 'teacher' });
                if (!teacher) {
                    const teacherEmail = `teacher.${Math.floor(Math.random()*1000)}@${school.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
                    teacher = await User.create({
                        schoolId: school._id,
                        name: `Teacher of ${school.name}`,
                        email: teacherEmail,
                        password: 'password123',
                        role: 'teacher',
                        isActive: true
                    });
                    console.log(`  - Created Teacher: ${teacher.email}`);
                }

                const studentsToCreate = [];
                const classes = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
                const sections = ['A', 'B'];

                for (const cls of classes) {
                    for (const sec of sections) {
                        const studentCount = 3 + Math.floor(Math.random() * 3);
                        for (let i = 1; i <= studentCount; i++) {
                            studentsToCreate.push({
                                schoolId: school._id,
                                name: getRandomName(),
                                rollNumber: `${cls}${sec}${i.toString().padStart(3, '0')}-${Math.floor(Math.random()*1000)}`,
                                class: cls,
                                section: sec,
                                gender: Math.random() > 0.5 ? 'male' : 'female',
                                parentPhone: getRandomPhone(),
                                isActive: true
                            });
                        }
                    }
                }

                const createdStudents = await Student.insertMany(studentsToCreate, { ordered: false });
                console.log(`  - Created ${createdStudents.length} Students across classes 1-10.`);

                const currentMonth = new Date().toISOString().slice(0, 7);
                const fees = createdStudents.map(s => ({
                    schoolId: school._id,
                    studentId: s._id,
                    amount: 3000 + (Math.floor(Math.random() * 5) * 500),
                    month: currentMonth,
                    dueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
                    status: Math.random() > 0.7 ? 'paid' : 'unpaid',
                    paidAt: Math.random() > 0.7 ? new Date() : null
                }));
                await Fee.insertMany(fees, { ordered: false });
                console.log(`  - Created ${fees.length} Fee records.`);

                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const attendance = createdStudents.slice(0, 20).map(s => ({
                    schoolId: school._id,
                    studentId: s._id,
                    teacherId: teacher._id,
                    date: today,
                    status: Math.random() > 0.1 ? 'present' : 'absent'
                }));
                await Attendance.insertMany(attendance, { ordered: false });
                console.log(`  - Created ${attendance.length} Attendance records.`);
            } catch (innerErr) {
                console.error(`  ❌ Error seeding school ${school.name}:`, innerErr.message);
            }
        }

        console.log('\n✅ Extensive seeding complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Root Seeding failure:', err.message);
        process.exit(1);
    }
};

seedExtensive();
