const { ActivityLog } = require('../models');

const logActivity = async (action, entityType, entityId, details, userId, req) => {
  try {
    await ActivityLog.create({
      action,
      entityType,
      entityId,
      details,
      userId,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });
  } catch (error) {
    console.error('Activity logging error:', error);
  }
};

module.exports = {
  logActivity
};