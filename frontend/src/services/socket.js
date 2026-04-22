import { io } from 'socket.io-client';
import { store } from '../store';

let socket = null;

export const connectSocket = () => {
  if (socket?.connected) return socket;

  const token = store.getState().auth.token;
  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000', {
    auth: { token },
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => console.log('🔌 Socket connected'));
  socket.on('disconnect', () => console.log('🔌 Socket disconnected'));

  return socket;
};

export const joinTripRoom = (tripId) => {
  if (!socket) connectSocket();
  socket.emit('join:trip', tripId);
};

export const leaveTripRoom = (tripId) => {
  socket?.emit('leave:trip', tripId);
};

export const onSeatsUpdated = (callback) => {
  socket?.on('seats:updated', callback);
  return () => socket?.off('seats:updated', callback);
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};

export default { connectSocket, joinTripRoom, leaveTripRoom, onSeatsUpdated, disconnectSocket };
