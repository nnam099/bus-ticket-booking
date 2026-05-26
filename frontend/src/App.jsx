import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Layouts
import PublicLayout from './components/shared/PublicLayout';
import CustomerLayout from './components/shared/CustomerLayout';
import OperatorLayout from './components/shared/OperatorLayout';
import AdminLayout from './components/shared/AdminLayout';
import StaffLayout from './components/shared/StaffLayout';

// Public pages
const HomePage = React.lazy(() => import('./pages/HomePage'));;
const SearchResultsPage = React.lazy(() => import('./pages/SearchResultsPage'));;
const TripDetailPage = React.lazy(() => import('./pages/TripDetailPage'));;
const LookupPage = React.lazy(() => import('./pages/LookupPage'));;
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));;
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'));;
const ForgotPasswordPage = React.lazy(() => import('./pages/auth/ForgotPasswordPage'));;

// Customer pages
const CustomerDashboard = React.lazy(() => import('./pages/customer/Dashboard'));;
const BookingPage = React.lazy(() => import('./pages/customer/BookingPage'));;
const PaymentPage = React.lazy(() => import('./pages/customer/PaymentPage'));;
const PaymentCallbackPage = React.lazy(() => import('./pages/customer/PaymentCallbackPage'));;
const MyTicketsPage = React.lazy(() => import('./pages/customer/MyTicketsPage'));;
const TicketDetailPage = React.lazy(() => import('./pages/customer/TicketDetailPage'));;
const ProfilePage = React.lazy(() => import('./pages/customer/ProfilePage'));;

// Operator pages
const OperatorDashboard = React.lazy(() => import('./pages/operator/Dashboard'));;
const VehiclesPage = React.lazy(() => import('./pages/operator/VehiclesPage'));;
const RoutesPage = React.lazy(() => import('./pages/operator/RoutesPage'));;
const TripsPage = React.lazy(() => import('./pages/operator/TripsPage'));;
const OperatorReportsPage = React.lazy(() => import('./pages/operator/ReportsPage'));;

// Staff pages
const StaffDashboard = React.lazy(() => import('./pages/staff/Dashboard'));;
const TripCheckInPage = React.lazy(() => import('./pages/staff/TripCheckInPage'));;

// Admin pages
const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard'));;
const AdminOperatorsPage = React.lazy(() => import('./pages/admin/OperatorsPage'));;
const AdminUsersPage = React.lazy(() => import('./pages/admin/UsersPage'));;
const AdminAuditPage = React.lazy(() => import('./pages/admin/AuditPage'));;
const AdminReviewsPage = React.lazy(() => import('./pages/admin/ReviewsPage'));;

// Guards
const PrivateRoute = ({ children, roles }) => {
  const { user } = useSelector((s) => s.auth);
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.some((r) => user?.roles?.includes(r))) return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <Routes>
        {/* Public */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/trips/:id" element={<TripDetailPage />} />
          <Route path="/lookup" element={<LookupPage />} />
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
    </Suspense>
    </BrowserRouter>
  );
}
