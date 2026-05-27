const prisma = require('../config/prisma');
const logger = require('../utils/logger');
const { createPublicCode } = require('../utils/security');

const cleanupExpiredOtpCodes = async () => {
  const result = await prisma.otpCode.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { usedAt: { not: null } },
      ],
    },
  });
  if (result.count) logger.info(`Cleaned up ${result.count} expired/used OTP records`);
  return result.count;
};

const backfillPublicLookupCodes = async () => {
  const [orders, tickets] = await Promise.all([
    prisma.order.findMany({ where: { publicCode: null }, select: { id: true } }),
    prisma.ticketDetail.findMany({ where: { publicCode: null }, select: { id: true } }),
  ]);

  for (const order of orders) {
    await prisma.order.update({
      where: { id: order.id },
      data: { publicCode: createPublicCode('HD', order.id) },
    });
  }

  for (const ticket of tickets) {
    await prisma.ticketDetail.update({
      where: { id: ticket.id },
      data: { publicCode: createPublicCode('VE', ticket.id) },
    });
  }

  const total = orders.length + tickets.length;
  if (total) logger.info(`Backfilled ${total} public lookup codes`);
  return total;
};

module.exports = { backfillPublicLookupCodes, cleanupExpiredOtpCodes };
