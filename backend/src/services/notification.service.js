const prisma = require('../config/prisma');

const createNotification = async ({ userId, title, message, type = 'INFO', link = null, metadata = null }) => {
  if (!userId || !title || !message) return null;

  return prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type,
      link,
      metadata,
    },
  });
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
  return prisma.notification.createMany({ data });
};

module.exports = { createNotification, createNotifications };
