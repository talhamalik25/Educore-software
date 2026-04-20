const express = require('express');
const router = express.Router();
const { createFee, getFees, markFeePaid, getFeeSummary } = require('../controllers/fee.controller');
const protect = require('../middleware/protect');
const requireRole = require('../middleware/requireRole');
const { checkFeatureFlag } = require('../middleware/checkFeature');

router.post('/',           protect, requireRole('admin'), checkFeatureFlag('feeManagementEnabled'), createFee);
router.get('/',            protect, requireRole('admin'), checkFeatureFlag('feeManagementEnabled'), getFees);
router.get('/summary',     protect, requireRole('admin'), checkFeatureFlag('feeManagementEnabled'), getFeeSummary);
router.put('/:id/pay',     protect, requireRole('admin'), checkFeatureFlag('feeManagementEnabled'), markFeePaid);

module.exports = router;
