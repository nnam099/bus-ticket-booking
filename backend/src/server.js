require('dotenv').config();
const { validateRuntimeEnv } = require('./config/env');
validateRuntimeEnv();

const app = require('./app');
const { createServer } = require('http');
const { initSocket } = require('./config/socket');
const { connectRedis, redisClient } = require('./config/redis');
const { releaseExpiredSeatLocks } = require('./services/booking.service');
const { backfillPublicLookupCodes, cleanupExpiredOtpCodes } = require('./services/security-maintenance.service');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);

const start = async () => {
  await connectRedis();
  await initSocket(httpServer);
  await releaseExpiredSeatLocks();
  await backfillPublicLookupCodes();
  await cleanupExpiredOtpCodes();
  setInterval(async () => {
    try {
      const isMaster = await redisClient.set('cron_lock:maintenance', 'locked', { EX: 50, NX: true });
      if (isMaster) {
        await releaseExpiredSeatLocks();
        await cleanupExpiredOtpCodes();
      }
    } catch (error) {
      logger.error('Failed to run maintenance cron job:', error);
    }
  }, 60 * 1000);

  httpServer.listen(PORT, '0.0.0.0', () => {
    logger.info(`Bus Ticket API running on port ${PORT}`);
    logger.info(`API Docs: http://localhost:${PORT}/api/docs`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
  });
};

start().catch((error) => {
  logger.error('Failed to start server:', error);
  console.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});
