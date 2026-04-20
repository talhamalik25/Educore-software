const express = require('express');
const router = express.Router();
const protect = require('../middleware/protect');
const requireRole = require('../middleware/requireRole');
const { createApiKey, getApiKeys, revokeApiKey } = require('../controllers/apiKey.controller');

router.post('/', protect, requireRole('admin'), createApiKey);
router.get('/', protect, requireRole('admin'), getApiKeys);
router.delete('/:id', protect, requireRole('admin'), revokeApiKey);

module.exports = router;
