const prisma = require('../config/prisma');
const logger = require('../utils/logger');

const createNotification = async ({ userId, title, message, type = 'INFO', link = null, metadata = null }) => {
  if (!userId || !title || !message) return null;

  try {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link,
        metadata,
      },
    });
  } catch (err) {
    logger.error('Failed to create notification:', err);
    return null;
  }
};

const createNotifications = async (items = []) => {
  const data = items
    .filter(item => item?.userId && item?.title && item?.message)
    .map(item => ({
      userId: item.userId,
      title: item.title,
      message: item.message,
      type: item.type || 'INFO',
      link: item.link || null,
      metadata: item.metadata || null,
    }));

  if (!data.length) return { count: 0 };
  try {
    return await prisma.notification.createMany({ data });
  } catch (err) {
    logger.error('Failed to create notifications:', err);
    return { count: 0 };
  }
};

module.exports = { createNotification, createNotifications };
