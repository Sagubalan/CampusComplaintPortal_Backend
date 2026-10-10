const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getAllComplaints,
  updateComplaint,
  deleteComplaint,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getAdminStats);
router.get('/complaints', getAllComplaints);
router.put('/complaints/:id', updateComplaint);
router.delete('/complaints/:id', deleteComplaint);

module.exports = router;
