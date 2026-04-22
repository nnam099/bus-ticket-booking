import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';

export default function PublicLayout() {
  const { user, token } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

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
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-brand">
            🚌 BusTicket
          </Link>

          <div className="flex items-center gap-4">
            {token ? (
              <>
                <Link to={getDashboardLink()} className="text-sm text-gray-600 hover:text-brand transition-colors">
                  {user?.customer?.fullName || user?.busOperator?.companyName || user?.email || 'Tài khoản'}
                </Link>
                <button onClick={handleLogout} className="btn-outline text-sm py-1.5">
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-gray-600 hover:text-brand transition-colors">
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn-primary text-sm py-1.5">
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
