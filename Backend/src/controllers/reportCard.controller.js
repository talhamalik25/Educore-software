const Student = require('../models/student.model');
const Result = require('../models/result.model');
const School = require('../models/school.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const puppeteer = require('puppeteer');

/**
 * Helper to calculate grade from percentage
 */
const calculateGrade = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
};

// Internal helper for data fetching to reuse in PDF generation
const fetchReportData = async (studentId, schoolId, examType, term) => {
    // 1. Fetch Student Details
    const student = await Student.findOne({ _id: studentId, schoolId })
        .select('name rollNumber class section');
    if (!student) throw new Error('Student not found.');

    // 2. Fetch School Details
    const school = await School.findById(schoolId)
        .select('name address logoUrl principalName motto');

    // 3. Fetch Results
    const resultQuery = { studentId, schoolId };
    if (examType) resultQuery.examType = examType;
    
    const results = await Result.find(resultQuery).select('subject totalMarks obtainedMarks grade examType');

    // 4. Calculate Summary
    let totalMarks = 0;
    let totalObtained = 0;

    const processedResults = results.map(r => {
        const percentage = (r.obtainedMarks / r.totalMarks) * 100;
        totalMarks += r.totalMarks;
        totalObtained += r.obtainedMarks;
        return {
            subject: r.subject,
            totalMarks: r.totalMarks,
            obtainedMarks: r.obtainedMarks,
            percentage: percentage.toFixed(2),
            grade: r.grade,
            examType: r.examType
        };
    });

    const overallPercentage = totalMarks > 0 ? (totalObtained / totalMarks) * 100 : 0;
    const overallGrade = calculateGrade(overallPercentage);

    // 5. Calculate Class Position
    const classmateIds = await Student.find({ 
        schoolId, 
        class: student.class, 
        section: student.section 
    }).distinct('_id');

    const classmateResults = await Result.aggregate([
        { $match: { studentId: { $in: classmateIds }, schoolId, examType: examType || { $exists: true } } },
        { $group: {
            _id: '$studentId',
            totalObtained: { $sum: '$obtainedMarks' },
            totalMax: { $sum: '$totalMarks' }
        }},
        { $project: {
            percentage: { $multiply: [{ $divide: ['$totalObtained', '$totalMax'] }, 100] }
        }},
        { $sort: { percentage: -1 } }
    ]);

    const position = classmateResults.findIndex(r => r._id.toString() === studentId) + 1;
    const totalInClass = classmateResults.length;

    return {
        student,
        school,
        results: processedResults,
        summary: {
            totalObtained,
            totalMarks,
            overallPercentage: overallPercentage.toFixed(2),
            overallGrade,
            classPosition: `${position} out of ${totalInClass}`,
            term: term || 'N/A',
            isPass: overallPercentage >= 50,
            academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
        }
    };
};

// @desc    Get report card data
// @route   GET /api/report-card/:studentId
// @access  Admin, Teacher, Parent
const getReportCardData = async (req, res) => {
    try {
        const data = await fetchReportData(req.params.studentId, req.user.schoolId, req.query.examType, req.query.term);
        return sendSuccess(res, 200, 'Report card data fetched successfully', data);
    } catch (error) {
        return sendError(res, error.message === 'Student not found.' ? 404 : 500, error.message);
    }
};

// @desc    Generate Report Card PDF
// @route   GET /api/report-card/:studentId/pdf
// @access  Admin, Teacher, Parent
const generateReportCardPDF = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { examType, term } = req.query;
        const schoolId = req.user.schoolId;

        const data = await fetchReportData(studentId, schoolId, examType, term);
        const { student, school, results, summary } = data;

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; margin: 0; padding: 40px; }
                .header { text-align: center; margin-bottom: 30px; }
                .logo { width: 100px; height: 100px; object-fit: contain; margin-bottom: 10px; }
                .school-name { font-size: 28px; font-weight: bold; margin: 5px 0; color: #00A896; }
                .motto { font-style: italic; color: #666; font-size: 14px; }
                .divider { border-top: 2px solid #00A896; margin: 20px 0; }
                .info-table { width: 100%; margin-bottom: 30px; border-collapse: collapse; }
                .info-table td { padding: 8px 0; font-size: 14px; }
                .label { font-weight: bold; color: #555; width: 120px; }
                .results-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                .results-table th { background-color: #00A896; color: white; padding: 12px; text-align: left; font-size: 14px; }
                .results-table td { border: 1px solid #eee; padding: 12px; font-size: 14px; }
                .summary-row { background-color: #f9f9f9; font-weight: bold; }
                .status-badge { padding: 5px 15px; border-radius: 20px; font-weight: bold; text-transform: uppercase; font-size: 12px; }
                .pass { background-color: #dcfce7; color: #166534; }
                .fail { background-color: #fee2e2; color: #991b1b; }
                .footer { margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; }
                .signature-box { text-align: center; width: 200px; }
                .signature-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 5px; font-weight: bold; }
                .system-footer { text-align: center; font-size: 10px; color: #999; margin-top: 40px; }
            </style>
        </head>
        <body>
            <div class="header">
                ${school.logoUrl ? `<img src="${school.logoUrl}" class="logo" />` : ''}
                <div class="school-name">${school.name}</div>
                <div class="motto">${school.motto || ''}</div>
                <div class="motto">${school.address}</div>
            </div>
            <div class="divider"></div>
            <table class="info-table">
                <tr>
                    <td class="label">Student Name:</td>
                    <td>${student.name}</td>
                    <td class="label">Roll Number:</td>
                    <td>${student.rollNumber}</td>
                </tr>
                <tr>
                    <td class="label">Class:</td>
                    <td>${student.class} - ${student.section}</td>
                    <td class="label">Academic Year:</td>
                    <td>${summary.academicYear}</td>
                </tr>
                <tr>
                    <td class="label">Exam Type:</td>
                    <td>${examType || 'All Exams'}</td>
                    <td class="label">Term:</td>
                    <td>${summary.term}</td>
                </tr>
            </table>

            <table class="results-table">
                <thead>
                    <tr>
                        <th>Subject</th>
                        <th>Total Marks</th>
                        <th>Obtained</th>
                        <th>Percentage</th>
                        <th>Grade</th>
                    </tr>
                </thead>
                <tbody>
                    ${results.map(r => `
                        <tr>
                            <td>${r.subject}</td>
                            <td>${r.totalMarks}</td>
                            <td>${r.obtainedMarks}</td>
                            <td>${r.percentage}%</td>
                            <td>${r.grade}</td>
                        </tr>
                    `).join('')}
                    <tr class="summary-row">
                        <td>GRAND TOTAL</td>
                        <td>${summary.totalMarks}</td>
                        <td>${summary.totalObtained}</td>
                        <td>${summary.overallPercentage}%</td>
                        <td>${summary.overallGrade}</td>
                    </tr>
                </tbody>
            </table>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                <div>
                    <span style="font-weight: bold; margin-right: 10px;">OVERALL STATUS:</span>
                    <span class="status-badge ${summary.isPass ? 'pass' : 'fail'}">${summary.isPass ? 'PASS' : 'FAIL'}</span>
                </div>
                <div>
                    <span style="font-weight: bold; margin-right: 10px;">CLASS POSITION:</span>
                    <span style="color: #00A896; font-weight: bold;">${summary.classPosition}</span>
                </div>
            </div>

            <div class="footer">
                <div>
                    <p style="font-size: 12px; color: #666;">Date of Issue: ${new Date().toLocaleDateString()}</p>
                </div>
                <div class="signature-box">
                    <div class="signature-line">Principal Signature</div>
                    <div style="font-size: 12px; margin-top: 5px;">${school.principalName || ''}</div>
                </div>
            </div>

            <div class="system-footer">Generated by EduCore OS — Empowering Education through Intelligence</div>
        </body>
        </html>
        `;

        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        await browser.close();

        const fileName = `report-${student.name.replace(/\s+/g, '-')}-${examType || 'Overall'}.pdf`;
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${fileName}"`,
            'Content-Length': pdfBuffer.length
        });
        res.send(pdfBuffer);

    } catch (error) {
        console.error('PDF Generation Error:', error);
        return sendError(res, 500, error.message);
    }
};

module.exports = {
    getReportCardData,
    generateReportCardPDF
};