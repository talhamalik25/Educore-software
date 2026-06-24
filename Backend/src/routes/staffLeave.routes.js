const express = require('express');
const router = express.Router();
const { applyLeave, getAllLeaves, getMyLeaves, reviewLeave, deleteLeave } = require('../controllers/staffLeave.controller');
const protect = require('../middleware/protect');
const requireRole = require('../middleware/requireRole');
const { checkFeatureFlag } = require('../middleware/checkFeature');

router.post('/',             protect, requireRole('admin', 'teacher'), checkFeatureFlag('staffLeaveEnabled'), applyLeave);
router.get('/',              protect, requireRole('admin'), checkFeatureFlag('staffLeaveEnabled'), getAllLeaves);
router.get('/my',            protect, requireRole('teacher'), checkFeatureFlag('staffLeaveEnabled'), getMyLeaves);
router.put('/:id/review',   protect, requireRole('admin'), checkFeatureFlag('staffLeaveEnabled'), reviewLeave);
router.delete('/:id',       protect, requireRole('admin'), checkFeatureFlag('staffLeaveEnabled'), deleteLeave);

module.exports = router;
