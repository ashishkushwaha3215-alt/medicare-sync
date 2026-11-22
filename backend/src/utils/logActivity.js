const ActivityLog = require('../models/ActivityLog');

const logActivity = async ({ user, action, details = '' }) => {
  try {
    await ActivityLog.create({
      actor: user?._id || undefined,
      actorName: user?.name || 'System',
      role: user?.role || 'system',
      action,
      details,
    });
  } catch (err) {
    console.error('Activity log failed:', err.message);
  }
};

module.exports = logActivity;