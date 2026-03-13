const express = require('express');
const router = express.Router();
const { createFee, getFees, markFeePaid, getFeeSummary } = require('../controllers/fee.controller');
const protect = require('../middleware/protect');
const requireRole = require('../middleware/requireRole');
const checkFeature = require('../middleware/checkFeature');

router.post('/',           protect, requireRole('admin'), checkFeature('fee_management'), createFee);
router.get('/',            protect, requireRole('admin'), checkFeature('fee_management'), getFees);
router.get('/summary',     protect, requireRole('admin'), checkFeature('fee_management'), getFeeSummary);
router.put('/:id/pay',     protect, requireRole('admin'), checkFeature('fee_management'), markFeePaid);

module.exports = router;
