const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
      required: true,
    },
    remarks: {
      type: String,
      default: '',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedByName: {
      type: String,
      default: 'System',
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const attachmentSchema = new mongoose.Schema({
  url: { type: String, required: true },
  filename: { type: String, required: true },
  mimeType: { type: String, default: '' },
  size: { type: Number, default: 0 },
});

const complaintSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a complaint title'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a detailed description'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Please select a complaint category'],
      enum: [
        'Hostel',
        'Academic',
        'Infrastructure',
        'Mess & Canteen',
        'Electrical',
        'Sanitation',
        'Security',
        'IT & Network',
        'Library',
        'Other',
      ],
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    locationZone: {
      type: String,
      required: [true, 'Please provide the campus zone or building'],
      trim: true,
    },
    locationDetails: {
      type: String,
      required: [true, 'Please provide specific room or floor details'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
      default: 'Pending',
      index: true,
    },
    attachments: [attachmentSchema],
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedDepartment: {
      type: String,
      default: 'General Administration',
      trim: true,
    },
    assignedOfficer: {
      type: String,
      default: 'Unassigned',
      trim: true,
    },
    resolutionRemarks: {
      type: String,
      default: '',
      trim: true,
    },
    statusHistory: [statusHistorySchema],
  },
  {
    timestamps: true,
  }
);

// Auto-generate ticketId before saving if not present
complaintSchema.pre('save', async function (next) {
  if (!this.ticketId) {
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    this.ticketId = `CMP-${timestamp}-${randomSuffix}`;
  }
  next();
});

module.exports = mongoose.model('Complaint', complaintSchema);
