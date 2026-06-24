const express = require('express');
const router = express.Router();
const {
    createAdmission,
    getAllAdmissions,
    getAdmissionById,
    updateAdmission,
    uploadDocument,
    deleteDocument,
    convertToStudent,
    getAdmissionStats,
    deleteAdmission,
} = require('../controllers/admission.controller');
const protect = require('../middleware/protect');
const requireRole = require('../middleware/requireRole');
const { upload } = require('../config/cloudinary');

router.post('/',                       protect, requireRole('admin'), createAdmission);
router.get('/',                        protect, requireRole('admin'), getAllAdmissions);
router.get('/stats',                   protect, requireRole('admin'), getAdmissionStats);
router.get('/:id',                     protect, requireRole('admin'), getAdmissionById);
router.put('/:id',                     protect, requireRole('admin'), updateAdmission);
router.post('/:id/documents',          protect, requireRole('admin'), upload.single('document'), uploadDocument);
router.delete('/:id/documents/:docId', protect, requireRole('admin'), deleteDocument);
router.post('/:id/convert',            protect, requireRole('admin'), convertToStudent);
router.delete('/:id',                  protect, requireRole('admin'), deleteAdmission);

module.exports = router;
