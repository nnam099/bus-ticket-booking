const { createClient } = require('redis');
const logger = require('../utils/logger');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => logger.error('Redis error:', err));
redisClient.on('connect', () => logger.info('✅ Redis connected'));

const connectRedis = async () => {
  await redisClient.connect();
};

module.exports = { redisClient, connectRedis };
