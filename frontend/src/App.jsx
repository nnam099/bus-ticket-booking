import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Layouts
import PublicLayout from './components/shared/PublicLayout';
import CustomerLayout from './components/shared/CustomerLayout';
import OperatorLayout from './components/shared/OperatorLayout';
import AdminLayout from './components/shared/AdminLayout';
import StaffLayout from './components/shared/StaffLayout';

// Public pages
import HomePage from './pages/HomePage';
import SearchResultsPage from './pages/SearchResultsPage';
import TripDetailPage from './pages/TripDetailPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Customer pages
import CustomerDashboard from './pages/customer/Dashboard';
import BookingPage from './pages/customer/BookingPage';
import PaymentPage from './pages/customer/PaymentPage';
import PaymentCallbackPage from './pages/customer/PaymentCallbackPage';
import MyTicketsPage from './pages/customer/MyTicketsPage';
import TicketDetailPage from './pages/customer/TicketDetailPage';
import ProfilePage from './pages/customer/ProfilePage';

// Operator pages
import OperatorDashboard from './pages/operator/Dashboard';
import VehiclesPage from './pages/operator/VehiclesPage';
import RoutesPage from './pages/operator/RoutesPage';
import TripsPage from './pages/operator/TripsPage';
import OperatorReportsPage from './pages/operator/ReportsPage';

// Staff pages
import StaffDashboard from './pages/staff/Dashboard';
import TripCheckInPage from './pages/staff/TripCheckInPage';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminOperatorsPage from './pages/admin/OperatorsPage';
import AdminUsersPage from './pages/admin/UsersPage';
import AdminAuditPage from './pages/admin/AuditPage';
import AdminReviewsPage from './pages/admin/ReviewsPage';

// Guards
const PrivateRoute = ({ children, roles }) => {
  const { user, token } = useSelector((s) => s.auth);
  if (!token) return <Navigate to="/login" replace />;
  if (roles && !roles.some((r) => user?.roles?.includes(r))) return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/trips/:id" element={<TripDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Customer */}
        <Route element={<PrivateRoute roles={['CUSTOMER']}><CustomerLayout /></PrivateRoute>}>
          <Route path="/dashboard" element={<CustomerDashboard />} />
          <Route path="/booking/:tripId" element={<BookingPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/payment/callback" element={<PaymentCallbackPage />} />
          <Route path="/my-tickets" element={<MyTicketsPage />} />
          <Route path="/my-tickets/:id" element={<TicketDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Operator */}
        <Route element={<PrivateRoute roles={['BUS_OPERATOR']}><OperatorLayout /></PrivateRoute>}>
          <Route path="/operator" element={<OperatorDashboard />} />
          <Route path="/operator/vehicles" element={<VehiclesPage />} />
          <Route path="/operator/routes" element={<RoutesPage />} />
          <Route path="/operator/trips" element={<TripsPage />} />
          <Route path="/operator/reports" element={<OperatorReportsPage />} />
        </Route>

        {/* Staff */}
        <Route element={<PrivateRoute roles={['STAFF']}><StaffLayout /></PrivateRoute>}>
          <Route path="/staff" element={<StaffDashboard />} />
          <Route path="/staff/trips/:tripId/check-in" element={<TripCheckInPage />} />
        </Route>

        {/* Admin */}
        <Route element={<PrivateRoute roles={['ADMIN']}><AdminLayout /></PrivateRoute>}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/operators" element={<AdminOperatorsPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/audit" element={<AdminAuditPage />} />
          <Route path="/admin/reviews" element={<AdminReviewsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
