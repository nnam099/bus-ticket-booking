require('dotenv').config();
const app = require('./app');
const { createServer } = require('http');
const { initSocket } = require('./config/socket');
const { connectRedis } = require('./config/redis');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);
initSocket(httpServer);

const start = async () => {
  await connectRedis();

  httpServer.listen(PORT, () => {
    logger.info(`Bus Ticket API running on port ${PORT}`);
    logger.info(`API Docs: http://localhost:${PORT}/api/docs`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
  });
};

start().catch((error) => {
  logger.error('Failed to start server:', error);
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
