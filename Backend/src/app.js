const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { markOverdueFees } = require('./controllers/fee.controller');

const app = express();

// Connect to MongoDB
connectDB();

// Run overdue check on startup
markOverdueFees();

// Run every 24 hours
setInterval(markOverdueFees, 24 * 60 * 60 * 1000);

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',');
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth',        require('./routes/auth.routes'));
app.use('/api/schools',     require('./routes/school.routes'));
app.use('/api/users',       require('./routes/user.routes'));
app.use('/api/students',    require('./routes/student.routes'));
app.use('/api/fees',        require('./routes/fee.routes'));
app.use('/api/attendance',  require('./routes/attendance.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/superadmin', require('./routes/superadmin.routes'));
app.use('/api/homework', require('./routes/homework.routes'));
app.use('/api/timetable', require('./routes/timetable.routes'));
app.use('/api/results', require('./routes/result.routes'));
app.use('/api/complaints', require('./routes/complaint.routes'));
app.use('/api/ai', require('./routes/aiAnalyzer.routes'));
app.use('/api/report-card', require('./routes/reportCard.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use('/api/invoices', require('./routes/invoice.routes'));
app.use('/api/api-keys', require('./routes/apiKey.routes'));
app.use('/api/admissions', require('./routes/admission.routes'));
app.use('/api/events', require('./routes/event.routes'));
app.use('/api/staff-leaves', require('./routes/staffLeave.routes'));
app.use('/api/staff-attendance', require('./routes/staffAttendance.routes'));

// Health check
app.get('/', (req, res) => {
    res.json({ message: '✅ EduCore API is running' });
});

module.exports = app;
