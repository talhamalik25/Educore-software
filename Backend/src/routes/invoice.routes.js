const express = require('express');
const router = express.Router();
const protect = require('../middleware/protect');
const requireRole = require('../middleware/requireRole');
const { 
    generateInvoice, 
    getInvoices, 
    getStudentInvoices, 
    markInvoicePaid, 
    deleteInvoice,
    getMyChildInvoices
} = require('../controllers/invoice.controller');

router.post('/', protect, requireRole('admin'), generateInvoice);
router.get('/', protect, requireRole('admin'), getInvoices);
router.get('/my-child', protect, requireRole('parent'), getMyChildInvoices);
router.get('/student/:studentId', protect, requireRole('admin', 'parent'), getStudentInvoices);
router.put('/:id/pay', protect, requireRole('admin'), markInvoicePaid);
router.delete('/:id', protect, requireRole('admin'), deleteInvoice);

module.exports = router;
