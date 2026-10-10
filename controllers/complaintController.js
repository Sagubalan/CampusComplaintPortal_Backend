const Complaint = require('../models/Complaint');

// @desc    Create a new complaint
// @route   POST /api/complaints
// @access  Private (Student)
const createComplaint = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      priority,
      locationZone,
      locationDetails,
    } = req.body;

    if (!title || !description || !category || !locationZone || !locationDetails) {
      return res.status(400).json({
        success: false,
        message:
          'Please provide title, description, category, campus zone, and specific location details.',
      });
    }

    const attachments = [];
    if (req.file) {
      attachments.push({
        url: `/uploads/${req.file.filename}`,
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      });
    }

    const initialHistory = [
      {
        status: 'Pending',
        remarks: 'Complaint registered successfully by student.',
        updatedBy: req.user._id,
        updatedByName: req.user.name,
        updatedAt: new Date(),
      },
    ];

    const complaint = await Complaint.create({
      title,
      description,
      category,
      priority: priority || 'Medium',
      locationZone,
      locationDetails,
      status: 'Pending',
      attachments,
      student: req.user._id,
      statusHistory: initialHistory,
    });

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully.',
      complaint,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current student's complaints
// @route   GET /api/complaints/my
// @access  Private (Student)
const getMyComplaints = async (req, res, next) => {
  try {
    const { status, category, search, priority } = req.query;

    const query = { student: req.user._id };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { ticketId: searchRegex },
        { locationZone: searchRegex },
        { description: searchRegex },
      ];
    }

    const complaints = await Complaint.find(query)
      .sort({ createdAt: -1 })
      .populate('student', 'name email studentId department phone');

    res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single complaint by ID or ticket ID
// @route   GET /api/complaints/:id
// @access  Private (Student: own only, Admin: all)
const getComplaintById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if queried by mongo ObjectId or ticketId
    let query = {};
    if (id.startsWith('CMP-')) {
      query = { ticketId: id };
    } else {
      query = { _id: id };
    }

    const complaint = await Complaint.findOne(query)
      .populate('student', 'name email studentId department phone')
      .populate('statusHistory.updatedBy', 'name role');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint ticket not found.',
      });
    }

    // Role verification: Students can only view their own complaint
    if (
      req.user.role !== 'admin' &&
      complaint.student._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own complaints.',
      });
    }

    res.status(200).json({
      success: true,
      complaint,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createComplaint,
  getMyComplaints,
  getComplaintById,
};
