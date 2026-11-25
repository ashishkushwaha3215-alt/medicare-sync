
const ActivityLog = require('../models/ActivityLog');

const logActivity = async ({ user, action, details = '' } = {}) => {
  try {
    if (!action || typeof action !== 'string' || !action.trim()) {
      console.error('Activity log skipped: Invalid action');
      return;
    }

    await ActivityLog.create({
      actor: user?._id || undefined,
      actorName: user?.name || 'System',
      role: user?.role || 'system',
      action: action.trim(),
      details: String(details || '').trim(),
    });
  } catch (err) {
    console.error('Activity log failed:', err.message);
  }
};

module.exports = logActivity;
