const { createClient } = require('redis');
const logger = require('../utils/logger');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: false,
  },
});

redisClient.on('error', (err) => logger.error('Redis error:', err));
redisClient.on('connect', () => logger.info('✅ Redis connected'));

const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    logger.warn(`Failed to connect to Redis: ${err.message}. The app will run without cache.`);
  }
};

module.exports = { redisClient, connectRedis };
