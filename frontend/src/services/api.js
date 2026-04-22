import axios from 'axios';
import { store } from '../store';
import { logout } from '../store/slices/authSlice';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach JWT
api.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor - handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      store.dispatch(logout());
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  sendOtp: (data) => api.post('/auth/send-otp', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// Trip API
export const tripAPI = {
  search: (params) => api.get('/trips/search', { params }),
  getById: (id) => api.get(`/trips/${id}`),
  create: (data) => api.post('/trips', data),
  updateStatus: (id, data) => api.patch(`/trips/${id}/status`, data),
};

// Booking API
export const bookingAPI = {
  lockSeats: (data) => api.post('/bookings/lock', data),
  releaseSeats: (data) => api.post('/bookings/release', data),
  confirm: (data) => api.post('/bookings/confirm', data),
  cancelTicket: (ticketId) => api.delete(`/bookings/tickets/${ticketId}`),
};

// User API
export const userAPI = {
  getMe: () => api.get('/users/me'),
  updateMe: (data) => api.put('/users/me', data),
  changePassword: (data) => api.put('/users/me/password', data),
  getMyTickets: () => api.get('/users/me/tickets'),
  deleteAccount: () => api.delete('/users/me'),
};

// Operator API
export const operatorAPI = {
  getAll: () => api.get('/operators'),
  getById: (id) => api.get(`/operators/${id}`),
  getDashboard: (period) => api.get('/operators/me/dashboard', { params: { period } }),
  update: (data) => api.put('/operators/me', data),
};

// Vehicle API
export const vehicleAPI = {
  getMyVehicles: () => api.get('/vehicles'),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  delete: (id) => api.delete(`/vehicles/${id}`),
};

// Route API
export const routeAPI = {
  getAll: (params) => api.get('/routes', { params }),
  create: (data) => api.post('/routes', data),
  update: (id, data) => api.put(`/routes/${id}`, data),
  delete: (id) => api.delete(`/routes/${id}`),
};

// Ticket API
export const ticketAPI = {
  getById: (id) => api.get(`/tickets/${id}`),
  checkIn: (id) => api.patch(`/tickets/${id}/check-in`),
  getByTrip: (tripId) => api.get(`/tickets/trip/${tripId}`),
};

// Review API
export const reviewAPI = {
  create: (data) => api.post('/reviews', data),
  getByOperator: (operatorId) => api.get(`/reviews/operator/${operatorId}`),
};

// Admin API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getPendingOperators: () => api.get('/admin/operators/pending'),
  approveOperator: (id) => api.patch(`/admin/operators/${id}/approve`),
  toggleUserActive: (id) => api.patch(`/admin/users/${id}/toggle-active`),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
  getPendingReviews: () => api.get('/admin/reviews/pending'),
  approveReview: (id) => api.patch(`/admin/reviews/${id}/approve`),
};

// Staff API
export const staffAPI = {
  getAssignedTrips: () => api.get('/staff/trips/assigned'),
  getPassengers: (tripId) => api.get(`/staff/trips/${tripId}/passengers`),
};

// Payment API
export const paymentAPI = {
  initiate: (data) => api.post('/payments/initiate', data),
  getByOrder: (orderId) => api.get(`/payments/order/${orderId}`),
};

export default api;
