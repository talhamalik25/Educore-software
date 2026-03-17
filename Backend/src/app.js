const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
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

// Health check
app.get('/', (req, res) => {
    res.json({ message: '✅ EduCore API is running' });
});

module.exports = app;
