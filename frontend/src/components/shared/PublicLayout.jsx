import { Outlet, Link, useNavigate, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';

export default function PublicLayout() {
  const { user } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Ngăn chặn các tài khoản nội bộ (Admin, Operator, Staff) truy cập trang khách hàng
  if (user?.roles) {
    if (user.roles.includes('ADMIN')) return <Navigate to="/admin" replace />;
    if (user.roles.includes('BUS_OPERATOR')) return <Navigate to="/operator" replace />;
    if (user.roles.includes('STAFF')) return <Navigate to="/staff" replace />;
  }

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user?.roles) return '/dashboard';
    if (user.roles.includes('ADMIN')) return '/admin';
    if (user.roles.includes('BUS_OPERATOR')) return '/operator';
    if (user.roles.includes('STAFF')) return '/staff';
    return '/dashboard';
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 sticky top-0 z-50 transition-all">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-black text-2xl bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent hover:scale-105 transition-transform">
            🚌 BusTicket
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link to={getDashboardLink()} className="font-medium text-sm text-gray-700 hover:text-brand transition-colors flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand">👤</span>
                  {user?.customer?.fullName || user?.busOperator?.companyName || user?.email || 'Tài khoản'}
                </Link>
                <button onClick={handleLogout} className="btn-outline text-sm py-1.5 px-4 shadow-sm hover:shadow-md border-brand/20">
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="font-medium text-sm text-gray-600 hover:text-brand transition-colors">
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn-primary text-sm py-1.5 px-5 shadow-md shadow-brand/30 hover:shadow-brand/50">
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 page-enter">
        <Outlet />
      </main>

      <footer className="bg-gray-800 text-gray-400 text-sm py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="font-semibold text-white mb-1">🚌 BusTicket</p>
          <p>Hệ thống đặt vé xe khách trực tuyến — Nhanh chóng, tiện lợi, an toàn</p>
          <p className="mt-2 text-xs">© 2026 BusTicket. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
