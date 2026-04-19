const express = require('express');
const router = express.Router();
const { register, login, registerSchool, getMe, refresh, logout, forgotPassword, resetPassword, googleLogin } = require('../controllers/auth.controller');
const protect = require('../middleware/protect');

router.post('/register', register);
router.post('/login', login);
router.post('/register-school', registerSchool);
router.post('/refresh', refresh);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/google', googleLogin);

module.exports = router;
