
const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    actorName: {
      type: String,
      trim: true,
      maxlength: 100,
      default: 'System',
    },

    role: {
      type: String,
      trim: true,
      lowercase: true,
      default: 'system',
    },

    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    details: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
  },
  { timestamps: true }
);

// Latest activity logs first
activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
