const express = require('express');
const router = express.Router();

const protect = require('../middleware/protect');
const requireRole = require('../middleware/requireRole');
const { checkLimit } = require('../middleware/checkFeature');

const { getNotifications, createNotification } = require('../controllers/notification.controller');

router.get('/', protect, requireRole('admin', 'superadmin'), getNotifications);
router.post('/', protect, requireRole('admin', 'superadmin', 'teacher'), createNotification);

module.exports = router;

