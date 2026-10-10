const Complaint = require('../models/Complaint');
const User = require('../models/User');

// @desc    Get dashboard statistics for administrator
// @route   GET /api/admin/stats
// @access  Private (Admin only)
const getAdminStats = async (req, res, next) => {
  try {
    const [
      total,
      pending,
      inProgress,
      resolved,
      rejected,
      categoryAgg,
      priorityAgg,
      totalStudents,
    ] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'Pending' }),
      Complaint.countDocuments({ status: 'In Progress' }),
      Complaint.countDocuments({ status: 'Resolved' }),
      Complaint.countDocuments({ status: 'Rejected' }),
      Complaint.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      Complaint.aggregate([
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 },
          },
        },
      ]),
      User.countDocuments({ role: 'student' }),
    ]);

    const formattedCategoryStats = categoryAgg.map((item) => ({
      category: item._id,
      count: item.count,
    }));

    const statusBreakdown = [
      { status: 'Pending', count: pending, color: '#f59e0b' },
      { status: 'In Progress', count: inProgress, color: '#3b82f6' },
      { status: 'Resolved', count: resolved, color: '#10b981' },
      { status: 'Rejected', count: rejected, color: '#ef4444' },
    ];

    const resolutionRate =
      total > 0 ? Math.round((resolved / total) * 100) : 0;

    res.status(200).json({
      success: true,
      stats: {
        total,
        pending,
        inProgress,
        resolved,
        rejected,
        totalStudents,
        resolutionRate,
        categoryBreakdown: formattedCategoryStats,
        statusBreakdown,
        priorityBreakdown: priorityAgg.map((p) => ({
          priority: p._id,
          count: p.count,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all complaints with filters, search, and sorting
// @route   GET /api/admin/complaints
// @access  Private (Admin only)
const getAllComplaints = async (req, res, next) => {
  try {
    const { status, category, priority, search } = req.query;

    const query = {};

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

      // Check if student match
      const matchingStudents = await User.find({
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { studentId: searchRegex },
        ],
      }).select('_id');

      const studentIds = matchingStudents.map((s) => s._id);

      query.$or = [
        { ticketId: searchRegex },
        { title: searchRegex },
        { locationZone: searchRegex },
        { locationDetails: searchRegex },
        { description: searchRegex },
        { student: { $in: studentIds } },
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

// @desc    Update complaint status, assignment, and resolution remarks
// @route   PUT /api/admin/complaints/:id
// @access  Private (Admin only)
const updateComplaint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, assignedDepartment, assignedOfficer, resolutionRemarks } =
      req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    let statusChanged = false;
    if (status && status !== complaint.status) {
      statusChanged = true;
      complaint.status = status;
    }

    if (assignedDepartment !== undefined) {
      complaint.assignedDepartment = assignedDepartment;
    }

    if (assignedOfficer !== undefined) {
      complaint.assignedOfficer = assignedOfficer;
    }

    if (resolutionRemarks !== undefined) {
      complaint.resolutionRemarks = resolutionRemarks;
    }

    // Append to status history
    const remarksEntry =
      resolutionRemarks && resolutionRemarks.trim()
        ? resolutionRemarks.trim()
        : statusChanged
        ? `Status updated to ${status} by administrator.`
        : 'Complaint assignment details updated by administrator.';

    complaint.statusHistory.push({
      status: complaint.status,
      remarks: remarksEntry,
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      updatedAt: new Date(),
    });

    await complaint.save();

    const updatedComplaint = await Complaint.findById(id)
      .populate('student', 'name email studentId department phone')
      .populate('statusHistory.updatedBy', 'name role');

    res.status(200).json({
      success: true,
      message: 'Complaint updated successfully.',
      complaint: updatedComplaint,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete complaint (Admin maintenance)
// @route   DELETE /api/admin/complaints/:id
// @access  Private (Admin only)
const deleteComplaint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    await complaint.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Complaint removed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminStats,
  getAllComplaints,
  updateComplaint,
  deleteComplaint,
};
