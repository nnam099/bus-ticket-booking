const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { redisClient } = require('./redis');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { corsOrigin } = require('./cors');

let io;

const initSocket = async (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      credentials: true,
    },
  });

  try {
    const pubClient = redisClient.duplicate();
    const subClient = redisClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
  } catch (err) {
    logger.warn('Failed to connect Redis Adapter for Socket.io: ' + err.message + '. Using in-memory adapter.');
  }

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        socket.user = jwt.verify(token, process.env.JWT_SECRET);
      } catch {
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    logger.info('Socket connected: ' + socket.id);
    socket.on('join:trip', (tripId) => {
      socket.join('trip:' + tripId);
    });
    socket.on('leave:trip', (tripId) => {
      socket.leave('trip:' + tripId);
    });
  });

  return io;
};

const getIo = () => io;

module.exports = { initSocket, getIo, get io() { return io; } };
