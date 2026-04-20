const Student = require('../models/student.model');
const User = require('../models/user.model');
const Attendance = require('../models/attendance.model');
const Fee = require('../models/fee.model');
const Result = require('../models/result.model');
const Complaint = require('../models/complaint.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');

exports.getOverviewAnalytics = async (req, res) => {
    try {
        const { schoolId } = req.user;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const currentMonth = new Date().toISOString().slice(0, 7);

        const [
            totalStudents,
            totalTeachers,
            totalParents,
            todayRecords,
            paidFees,
            pendingCount,
            complaintsOpen
        ] = await Promise.all([
            Student.countDocuments({ schoolId, isActive: true }),
            User.countDocuments({ schoolId, role: 'teacher', isActive: true }),
            User.countDocuments({ schoolId, role: 'parent', isActive: true }),
            Attendance.find({ schoolId, date: { $gte: today } }),
            Fee.aggregate([
                { $match: { schoolId, month: currentMonth, status: 'paid' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Fee.countDocuments({ schoolId, month: currentMonth, status: { $in: ['unpaid', 'overdue'] } }),
            Complaint.countDocuments({ schoolId, status: 'open' })
        ]);

        const presentCount = todayRecords.filter(r => r.status === 'present').length;
        const attendanceToday = todayRecords.length > 0 ? Math.round((presentCount / todayRecords.length) * 100) : 0;

        sendSuccess(res, 200, 'Overview analytics fetched', {
            totalStudents,
            totalTeachers,
            totalParents,
            attendanceToday,
            feesCollectedThisMonth: paidFees[0]?.total || 0,
            pendingFeesCount: pendingCount,
            complaintsOpen
        });
    } catch (error) {
        sendError(res, 500, error.message);
    }
};

exports.getAttendanceAnalytics = async (req, res) => {
    try {
        const { schoolId } = req.user;
        const { startDate, endDate, class: className, section } = req.query;

        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        const filter = { schoolId, date: { $gte: start, $lte: end } };

        if (className) {
            const students = await Student.find({ schoolId, class: className, ...(section && { section }) });
            filter.studentId = { $in: students.map(s => s._id) };
        }

        const dailyAttendance = await Attendance.aggregate([
            { $match: filter },
            { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                presentCount: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
                absentCount: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
                lateCount: { $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] } }
            }},
            { $sort: { _id: 1 } }
        ]);

        const worstStudents = await Attendance.aggregate([
            { $match: filter },
            { $group: {
                _id: '$studentId',
                total: { $sum: 1 },
                present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } }
            }},
            { $project: {
                studentId: '$_id',
                percentage: { $multiply: [{ $divide: ["$present", "$total"] }, 100] },
                _id: 0
            }},
            { $sort: { percentage: 1 } },
            { $limit: 10 },
            { $lookup: {
                from: 'students',
                localField: 'studentId',
                foreignField: '_id',
                as: 'student'
            }},
            { $unwind: '$student' },
            { $project: {
                name: '$student.name',
                class: '$student.class',
                section: '$student.section',
                percentage: { $round: ["$percentage", 1] }
            }}
        ]);

        sendSuccess(res, 200, 'Attendance analytics fetched', { dailyAttendance, worstStudents });
    } catch (error) {
        sendError(res, 500, error.message);
    }
};

exports.getFeeAnalytics = async (req, res) => {
    try {
        const { schoolId } = req.user;

        const months = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            months.push(d.toISOString().slice(0, 7));
        }

        const monthlyCollection = await Promise.all(months.map(async (m) => {
            const fees = await Fee.find({ schoolId, month: m });
            const collected = fees.filter(f => f.status === 'paid').reduce((s, f) => s + (f.amount || 0), 0);
            const pending = fees.filter(f => ['unpaid', 'overdue'].includes(f.status)).reduce((s, f) => s + (f.amount || 0), 0);
            
            const [year, month] = m.split('-');
            const date = new Date(year, month - 1);
            const label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

            return { month: label, collected, pending };
        }));

        const paymentMethodBreakdown = await Fee.aggregate([
            { $match: { schoolId, status: 'paid' } },
            { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$amount' } } }
        ]);

        const [paidCount, totalCount, unpaidCount, overdueCount] = await Promise.all([
            Fee.countDocuments({ schoolId, status: 'paid' }),
            Fee.countDocuments({ schoolId }),
            Fee.countDocuments({ schoolId, status: 'unpaid' }),
            Fee.countDocuments({ schoolId, status: 'overdue' })
        ]);

        sendSuccess(res, 200, 'Fee analytics fetched', {
            monthlyCollection,
            paymentMethodBreakdown,
            collectionRate: totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0,
            defaulterCount: unpaidCount + overdueCount
        });
    } catch (error) {
        sendError(res, 500, error.message);
    }
};

exports.getResultsAnalytics = async (req, res) => {
    try {
        const { schoolId } = req.user;
        const { class: className, section, examType } = req.query;

        const filter = { schoolId };
        if (className) filter.class = className;
        if (section) filter.section = section;
        if (examType) filter.examType = examType;

        const subjectWiseAverage = await Result.aggregate([
            { $match: filter },
            { $group: {
                _id: '$subject',
                avgPercentage: { $avg: { $multiply: [{ $divide: ['$obtainedMarks', '$totalMarks'] }, 100] } },
                passCount: { $sum: { $cond: [{ $gte: [{ $divide: ['$obtainedMarks', '$totalMarks'] }, 0.5] }, 1, 0] } },
                totalCount: { $sum: 1 }
            }},
            { $project: {
                subject: '$_id',
                avgPercentage: { $round: ["$avgPercentage", 1] },
                passRate: { $round: [{ $multiply: [{ $divide: ["$passCount", "$totalCount"] }, 100] }, 1] },
                _id: 0
            }}
        ]);

        const gradeDistribution = await Result.aggregate([
            { $match: filter },
            { $group: { _id: '$grade', count: { $sum: 1 } } },
            { $project: { grade: '$_id', count: 1, _id: 0 } }
        ]);

        const topStudents = await Result.aggregate([
            { $match: filter },
            { $group: {
                _id: '$studentId',
                avgPercentage: { $avg: { $multiply: [{ $divide: ['$obtainedMarks', '$totalMarks'] }, 100] } }
            }},
            { $sort: { avgPercentage: -1 } },
            { $limit: 5 },
            { $lookup: {
                from: 'students',
                localField: '_id',
                foreignField: '_id',
                as: 'student'
            }},
            { $unwind: '$student' },
            { $project: {
                name: '$student.name',
                class: '$student.class',
                avgPercentage: { $round: ["$avgPercentage", 1] },
                _id: 0
            }}
        ]);

        sendSuccess(res, 200, 'Results analytics fetched', { subjectWiseAverage, gradeDistribution, topStudents });
    } catch (error) {
        sendError(res, 500, error.message);
    }
};
