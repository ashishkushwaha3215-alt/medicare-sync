
const Notification = require('../models/Notification');

const createNotification = async ({
  recipient,
  sender = null,
  title,
  message,
  type = 'system',
  relatedAppointment = null,
}) => {
  try {
    if (!recipient || !title || !message) {
      console.error('Notification skipped: required fields missing');
      return null;
    }

    return await Notification.create({
      recipient,
      sender,
      title,
      message,
      type,
      relatedAppointment,
    });
  } catch (error) {
    // Notification failure should not interrupt the main operation
    console.error('Notification creation failed:', error.message);
    return null;
  }
};

module.exports = createNotification;
