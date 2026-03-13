const express = require('express');
const router = express.Router();
const { createUser, getUsers, getUser, updateUser, deleteUser } = require('../controllers/user.controller');
const protect = require('../middleware/protect');
const requireRole = require('../middleware/requireRole');

router.post('/',     protect, requireRole('admin', 'superadmin'), createUser);
router.get('/',      protect, requireRole('admin', 'superadmin'), getUsers);
router.get('/:id',   protect, requireRole('admin', 'superadmin'), getUser);
router.put('/:id',   protect, requireRole('admin', 'superadmin'), updateUser);
router.delete('/:id',protect, requireRole('admin', 'superadmin'), deleteUser);

module.exports = router;
