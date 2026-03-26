const Homework = require('../models/homework.model');
const Submission = require('../models/submission.model');
const Student = require('../models/student.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const sendSMS = require('../utils/sendSMS');
const Notification = require('../models/notification.model');

// @desc    Create homework (Teacher)
// @route   POST /api/homework
// @access  Teacher, Admin
const createHomework = async (req, res) => {
    try {
        const { title, description, class: hClass, section, subject, dueDate } = req.body;
        
        let attachments = [];
        if (req.files) {
            attachments = req.files.map(file => ({
                name: file.originalname,
                url: file.path,
                publicId: file.filename
            }));
        }

        const homework = await Homework.create({
            schoolId: req.user.schoolId,
            title,
            description,
            class: hClass,
            section,
            subject,
            dueDate,
            attachments,
            createdBy: req.user._id,
        });

        // Notify parents of the class
        const students = await Student.find({ class: hClass, section, schoolId: req.user.schoolId, isActive: true }, 'parentPhone');
        const phones = [...new Set(students.map(s => s.parentPhone).filter(p => p))];
        
        const smsMessage = `New Homework: ${title} for Class ${hClass}-${section}. Due: ${new Date(dueDate).toLocaleDateString()}. Check portal for details.`;
        
        phones.forEach(phone => sendSMS(phone, smsMessage));

        // Create notification records
        if (students.length > 0) {
            const notifications = students.map(s => ({
                schoolId: req.user.schoolId,
                studentId: s._id,
                parentPhone: s.parentPhone,
                type: 'homework_assigned',
                message: smsMessage,
                status: 'sent'
            }));
            await Notification.insertMany(notifications, { ordered: false }).catch(() => {});
        }

        return sendSuccess(res, 201, 'Homework created successfully', { homework });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Get all homework (Filtered)
// @route   GET /api/homework
// @access  Admin, Teacher, Parent, Student
const getHomework = async (req, res) => {
    try {
        const filter = { schoolId: req.user.schoolId };

        if (req.query.class) filter.class = req.query.class;
        if (req.query.section) filter.section = req.query.section;
        if (req.query.subject) filter.subject = req.query.subject;

        // If parent/student, only show their class homework
        // (Assuming req.user has extra info or we fetch student info if parent)
        
        const homework = await Homework.find(filter).sort({ createdAt: -1 });
        return sendSuccess(res, 200, 'Homework fetched successfully', { homework });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Get single homework with submissions
// @route   GET /api/homework/:id
// @access  Teacher, Admin
const getHomeworkDetails = async (req, res) => {
    try {
        const homework = await Homework.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
        if (!homework) return sendError(res, 404, 'Homework not found');

        const submissions = await Submission.find({ homeworkId: homework._id })
            .populate('studentId', 'name rollNumber class section');

        return sendSuccess(res, 200, 'Homework details fetched', { homework, submissions });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Submit homework (Parent/Student)
// @route   POST /api/homework/:id/submit
// @access  Parent
const submitHomework = async (req, res) => {
    try {
        const { studentId } = req.body;
        if (!req.file) return sendError(res, 400, 'Submission file is required');

        // Check if student belongs to this parent (if parent is submitting)
        if (req.user.role === 'parent') {
            const student = await Student.findOne({ _id: studentId, parentId: req.user._id });
            if (!student) return sendError(res, 403, 'Unauthorized to submit for this student');
        }

        const homework = await Homework.findById(req.params.id);
        if (!homework) return sendError(res, 404, 'Homework not found');

        const submission = await Submission.findOneAndUpdate(
            { homeworkId: homework._id, studentId: studentId },
            {
                schoolId: req.user.schoolId,
                fileUrl: req.file.path,
                publicId: req.file.filename,
                fileName: req.file.originalname,
                submittedAt: new Date(),
                status: new Date() > homework.dueDate ? 'late' : 'pending',
            },
            { upsert: true, new: true }
        );

        return sendSuccess(res, 200, 'Homework submitted successfully', { submission });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

module.exports = { createHomework, getHomework, getHomeworkDetails, submitHomework };
