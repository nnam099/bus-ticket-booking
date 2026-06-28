import axios from 'axios';
import { store } from '../store';
import { logout } from '../store/slices/authSlice';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const HEALTH_URL = (import.meta.env.VITE_API_URL || '/api').replace('/api', '') || '';

// Tăng timeout lên 30s để chờ Render.com wake up từ trạng thái ngủ đông
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Đánh thức server nếu đang ngủ (Render Free tier)
export const wakeUpServer = async () => {
  try {
    await axios.get(`${HEALTH_URL}/health`, { timeout: 30000 });
    return true;
  } catch {
    return false;
  }
};

// Request interceptor - attach JWT
api.interceptors.request.use((config) => {
  // const token = store.getState().auth.token;
  // if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Hàm retry khi server đang khởi động (network error hoặc 503)
const retryRequest = async (error) => {
  const config = error.config;
  // Chỉ retry 1 lần, chỉ với lỗi network hoặc 503
  if (config._retried) return Promise.reject(error);
  const isNetworkError = !error.response;
  const is503 = error.response?.status === 503;
  if (isNetworkError || is503) {
    config._retried = true;
    // Đợi 3 giây rồi thử lại (server đang wake up)
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return api(config);
  }
  return Promise.reject(error);
};

// Response interceptor - handle 401 & retry on wake-up
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      store.dispatch(logout());
      window.location.href = '/login';
    }
    return retryRequest(err);
  }
);

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  registerOperator: (data) => api.post('/auth/register-operator', data),
  logout: () => api.post('/auth/logout'),
  sendOtp: (data) => api.post('/auth/send-otp', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// Trip API
export const tripAPI = {
  search: (params) => api.get('/trips/search', { params }),
  getById: (id) => api.get(`/trips/${id}`),
  getMine: () => api.get('/trips/operator/me'),
  create: (data) => api.post('/trips', data),
  update: (id, data) => api.put(`/trips/${id}`, data),
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
  getMyInvoices: () => api.get('/users/me/invoices'),
  getMyLockedSeats: () => api.get('/users/me/locked-seats'),
  deleteAccount: () => api.delete('/users/me'),
};

// Operator API
export const operatorAPI = {
  getAll: () => api.get('/operators'),
  getById: (id) => api.get(`/operators/${id}`),
  getDashboard: (filters = {}) => api.get('/operators/me/dashboard', { params: typeof filters === 'string' ? { period: filters } : filters }),
  update: (data) => api.put('/operators/me', data),
  getStaffs: () => api.get('/operators/me/staffs'),
  createStaff: (data) => api.post('/operators/me/staffs', data),
  toggleStaffActive: (id) => api.patch(`/operators/me/staffs/${id}/toggle-active`),
  resetStaffPassword: (id, newPassword) => api.patch(`/operators/me/staffs/${id}/reset-password`, { newPassword }),
};

// Vehicle API
export const vehicleAPI = {
  getMyVehicles: () => api.get('/vehicles'),
  getTypes: () => api.get('/vehicles/types'),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  delete: (id) => api.delete(`/vehicles/${id}`),
};

// Route API
export const routeAPI = {
  getAll: (params) => api.get('/routes', { params }),
  getMine: () => api.get('/routes/operator/me'),
  create: (data) => api.post('/routes', data),
  update: (id, data) => api.put(`/routes/${id}`, data),
  delete: (id) => api.delete(`/routes/${id}`),
};

// Ticket API
export const ticketAPI = {
  getById: (id) => api.get(`/tickets/${id}`),
  lookup: (params) => api.get('/tickets/lookup', { params }),
  checkIn: (id) => api.patch(`/tickets/${id}/check-in`),
  getByTrip: (tripId) => api.get(`/tickets/trip/${tripId}`),
};

// Review API
export const reviewAPI = {
  create: (data) => api.post('/reviews', data),
  getByOperator: (operatorId) => api.get(`/reviews/operator/${operatorId}`),
  getLatest: (limit) => api.get('/reviews/latest', { params: { limit } }),
};

// Notification API
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

// Admin API
export const adminAPI = {
  getStats: (params) => api.get('/admin/stats', { params }),
  getAllOperators: () => api.get('/admin/operators'),
  getPendingOperators: () => api.get('/admin/operators/pending'),
  approveOperator: (id) => api.patch(`/admin/operators/${id}/approve`),
  rejectOperator: (id) => api.delete(`/admin/operators/${id}/reject`),
  toggleUserActive: (id) => api.patch(`/admin/users/${id}/toggle-active`),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
  getPendingReviews: () => api.get('/admin/reviews/pending'),
  approveReview: (id) => api.patch(`/admin/reviews/${id}/approve`),
  rejectReview: (id) => api.delete(`/admin/reviews/${id}`),
};

// Staff API
export const staffAPI = {
  getDashboard: () => api.get('/staff/dashboard'),
  getAssignedTrips: () => api.get('/staff/trips/assigned'),
  getPassengers: (tripId) => api.get(`/staff/trips/${tripId}/passengers`),
};

// Payment API
export const paymentAPI = {
  initiate: (data) => api.post('/payments/initiate', data),
  completeMock: (data) => api.post('/payments/mock/complete', data),
  getByOrder: (orderId) => api.get(`/payments/order/${orderId}`),
  getOrderDetail: (orderId) => api.get(`/payments/order/${orderId}/detail`),
  lookupInvoice: (params) => api.get('/payments/invoices/lookup', { params }),
};

export default api;
