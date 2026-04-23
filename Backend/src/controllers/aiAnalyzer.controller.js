const Result = require('../models/result.model');
const Attendance = require('../models/attendance.model');
const Student = require('../models/student.model');
const AiReport = require('../models/aiReport.model');
const openai = require('../config/openai');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const pad2 = (n) => String(n).padStart(2, '0');

const currentReportMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
};

/** Average percentage per subject from result rows */
const subjectAveragesFromResults = (results) => {
    const bySubject = {};
    for (const r of results) {
        const sub = r.subject;
        if (!sub || !r.totalMarks) continue;
        const pct = (r.obtainedMarks / r.totalMarks) * 100;
        if (!bySubject[sub]) bySubject[sub] = { sum: 0, count: 0 };
        bySubject[sub].sum += pct;
        bySubject[sub].count += 1;
    }
    const averages = {};
    for (const [sub, { sum, count }] of Object.entries(bySubject)) {
        averages[sub] = count ? sum / count : 0;
    }
    return averages;
};

const computeRiskLevel = (attendanceScore, averageGrade) => {
    if (attendanceScore < 70 || averageGrade < 50) return 'high';
    if (attendanceScore < 80 || averageGrade < 65) return 'medium';
    return 'low';
};

const parseAiJson = (text) => {
    let raw = String(text || '').trim();
    if (raw.startsWith('```')) {
        raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/m, '').trim();
    }
    const parsed = JSON.parse(raw);
    if (!parsed.summary || !Array.isArray(parsed.recommendations)) {
        throw new Error('Invalid AI response shape');
    }
    const recs = parsed.recommendations.slice(0, 3).map(String);
    while (recs.length < 3) recs.push('Continue regular communication between school and home.');
    return { summary: String(parsed.summary), recommendations: recs.slice(0, 3) };
};

// @desc    Run AI analysis for a student and persist report (current month upsert)
// @route   POST /api/ai/analyze/:studentId
// @access  Admin, Teacher
const analyzeStudent = async (req, res) => {
    if (!openai) {
      return sendError(res, 503, 'AI service not configured. Please set OPENAI_API_KEY in .env');
    }
    try {
        const { studentId } = req.params;

        const student = await Student.findOne({
            _id: studentId,
            schoolId: req.user.schoolId,
        });
        if (!student) return sendError(res, 404, 'Student not found.');

        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [results, attendanceRecords] = await Promise.all([
            Result.find({
                studentId,
                schoolId: req.user.schoolId,
                examDate: { $gte: threeMonthsAgo },
            }).lean(),
            Attendance.find({
                studentId,
                schoolId: req.user.schoolId,
                date: { $gte: thirtyDaysAgo },
            }).lean(),
        ]);

        const subjectAvgs = subjectAveragesFromResults(results);
        const subjects = Object.keys(subjectAvgs);
        const weakSubjects = subjects.filter((s) => subjectAvgs[s] < 60);
        const strongSubjects = subjects.filter((s) => subjectAvgs[s] > 80);

        let averageGrade = 0;
        if (results.length > 0) {
            const pcts = results.map((r) =>
                r.totalMarks ? (r.obtainedMarks / r.totalMarks) * 100 : 0
            );
            averageGrade = pcts.reduce((a, b) => a + b, 0) / pcts.length;
        }

        const totalDays = attendanceRecords.length;
        const presentDays = attendanceRecords.filter((a) => a.status === 'present').length;
        const attendanceScore = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

        const riskLevel = computeRiskLevel(attendanceScore, averageGrade);

        const prompt = `You are an educational AI assistant for EduCore OS, a school management system in Pakistan.
Analyze this student's academic data and provide insights in simple English.
Student: ${student.name}, Class: ${student.class}-${student.section}
Attendance: ${Math.round(attendanceScore * 10) / 10}% in last 30 days
Average Score: ${Math.round(averageGrade * 10) / 10}%
Weak Subjects: ${weakSubjects.length ? weakSubjects.join(', ') : 'None'}
Strong Subjects: ${strongSubjects.length ? strongSubjects.join(', ') : 'None'}
Risk Level: ${riskLevel}

Provide:
1. A 3-4 sentence summary of the student's performance
2. Exactly 3 specific, actionable recommendations for teachers/parents

Respond in JSON format:
{ "summary": string, "recommendations": [string, string, string] }`;

        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_key_here') {
            return sendError(res, 500, 'OpenAI API key is not configured.');
        }

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
        });

        const content = completion.choices[0]?.message?.content;
        let aiSummary;
        let recommendations;
        try {
            ({ summary: aiSummary, recommendations } = parseAiJson(content));
        } catch (e) {
            return sendError(res, 500, 'Failed to parse AI response.');
        }

        const reportMonth = currentReportMonth();

        const report = await AiReport.findOneAndUpdate(
            { schoolId: req.user.schoolId, studentId, reportMonth },
            {
                schoolId: req.user.schoolId,
                studentId,
                reportMonth,
                generatedAt: new Date(),
                attendanceScore: Math.round(attendanceScore * 100) / 100,
                averageGrade: Math.round(averageGrade * 100) / 100,
                weakSubjects,
                strongSubjects,
                riskLevel,
                aiSummary,
                recommendations,
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        return sendSuccess(res, 200, 'AI analysis complete', { report });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Latest AI report for a student
// @route   GET /api/ai/report/:studentId
// @access  Admin, Teacher, Parent
const getStudentReport = async (req, res) => {
    try {
        const { studentId } = req.params;

        const student = await Student.findOne({
            _id: studentId,
            schoolId: req.user.schoolId,
        });
        if (!student) return sendError(res, 404, 'Student not found.');

        if (req.user.role === 'parent') {
            if (!student.parentId || String(student.parentId) !== String(req.user._id)) {
                return sendError(res, 403, 'Access denied.');
            }
        }

        const report = await AiReport.findOne({
            schoolId: req.user.schoolId,
            studentId,
        })
            .sort({ generatedAt: -1 })
            .populate('studentId', 'name class section rollNumber');

        if (!report) {
            return sendError(res, 404, 'No AI report found. Run analysis first.');
        }

        return sendSuccess(res, 200, 'Report fetched', { report });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Class risk overview from latest reports
// @route   GET /api/ai/class?class=&section=
// @access  Admin, Teacher
const getClassRiskReport = async (req, res) => {
    try {
        const { class: rClass, section } = req.query;
        if (!rClass || !section) {
            return sendError(res, 400, 'Class and section query params are required.');
        }

        const students = await Student.find({
            schoolId: req.user.schoolId,
            class: rClass,
            section,
            isActive: true,
        }).select('name _id');

        const riskOrder = { high: 0, medium: 1, low: 2 };
        const rows = [];

        for (const s of students) {
            const report = await AiReport.findOne({
                schoolId: req.user.schoolId,
                studentId: s._id,
            })
                .sort({ generatedAt: -1 })
                .lean();

            if (report) {
                rows.push({
                    studentId: s._id,
                    studentName: s.name,
                    riskLevel: report.riskLevel,
                    averageGrade: report.averageGrade,
                    weakSubjects: report.weakSubjects || [],
                });
            }
        }

        rows.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);

        return sendSuccess(res, 200, 'Class risk report', { students: rows });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    School-wide risk counts (latest report per student)
// @route   GET /api/ai/school-summary
// @access  Admin
const getSchoolRiskSummary = async (req, res) => {
    try {
        const schoolId = req.user.schoolId;

        const latestPerStudent = await AiReport.aggregate([
            { $match: { schoolId } },
            { $sort: { generatedAt: -1 } },
            {
                $group: {
                    _id: '$studentId',
                    riskLevel: { $first: '$riskLevel' },
                },
            },
        ]);

        const counts = { high: 0, medium: 0, low: 0 };
        for (const row of latestPerStudent) {
            if (counts[row.riskLevel] !== undefined) counts[row.riskLevel] += 1;
        }

        return sendSuccess(res, 200, 'School risk summary', {
            high: counts.high,
            medium: counts.medium,
            low: counts.low,
            totalAnalyzed: latestPerStudent.length,
        });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

module.exports = {
    analyzeStudent,
    getStudentReport,
    getClassRiskReport,
    getSchoolRiskSummary,
};
