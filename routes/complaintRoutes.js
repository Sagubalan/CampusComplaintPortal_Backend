const express = require('express');
const router = express.Router();
const {
  createComplaint,
  getMyComplaints,
  getComplaintById,
} = require('../controllers/complaintController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All complaint routes require authentication
router.use(protect);

router.post('/', upload.single('attachment'), createComplaint);
router.get('/my', getMyComplaints);
router.get('/:id', getComplaintById);

module.exports = router;
