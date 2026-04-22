const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Auth middleware for socket
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        socket.user = jwt.verify(token, process.env.JWT_SECRET);
      } catch {
        // unauthenticated connections still allowed for public rooms (viewing seat map)
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Join trip room to receive real-time seat updates
    socket.on('join:trip', (tripId) => {
      socket.join(`trip:${tripId}`);
      logger.info(`Socket ${socket.id} joined trip:${tripId}`);
    });

    socket.on('leave:trip', (tripId) => {
      socket.leave(`trip:${tripId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIo = () => io;

module.exports = { initSocket, getIo, get io() { return io; } };
