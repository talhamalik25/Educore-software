const express = require('express');
const router = express.Router();
const { register, login, registerSchool, getMe, refresh } = require('../controllers/auth.controller');
const protect = require('../middleware/protect');

router.post('/register', register);
router.post('/register-school', registerSchool);
router.post('/login', login);
router.post('/refresh', refresh);
router.get('/me', protect, getMe);

module.exports = router;
