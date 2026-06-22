import { Outlet, Link, useNavigate, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { authAPI } from '../../services/api';
import ThemeToggle from './ThemeToggle';

export default function PublicLayout() {
  const { user } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redirect internal roles away from public pages
  if (user?.roles) {
    if (user.roles.includes('ADMIN')) return <Navigate to="/admin" replace />;
    if (user.roles.includes('BUS_OPERATOR')) return <Navigate to="/operator" replace />;
    if (user.roles.includes('STAFF')) return <Navigate to="/staff" replace />;
  }

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } finally {
      dispatch(logout());
      navigate('/');
    }
  };

  const getDashboardLink = () => {
    if (!user?.roles) return '/dashboard';
    if (user.roles.includes('ADMIN')) return '/admin';
    if (user.roles.includes('BUS_OPERATOR')) return '/operator';
    if (user.roles.includes('STAFF')) return '/staff';
    return '/dashboard';
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#fdfbf7', fontFamily: "'Nunito', sans-serif" }}>
      {/* ── Navbar ── */}
      <nav
        className="sticky top-0 z-50 w-full"
        style={{
          background: 'rgba(253,251,247,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1.5px solid #f0e6d8',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 no-underline">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: '#e85d04' }}
            >
              <i className="ti ti-bus text-white" style={{ fontSize: 18 }} />
            </div>
            <span
              className="text-xl font-bold"
              style={{ fontFamily: "'Quicksand', sans-serif", color: '#4a3b32' }}
            >
              BusGo{' '}
              <span style={{ color: '#e85d04' }}>Việt Nam</span>
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { label: 'Trang chủ', to: '/' },
              { label: 'Tìm chuyến', to: '/#search-form' },
              { label: 'Tra cứu vé', to: '/lookup' },
              { label: 'Hỗ trợ', to: '#' },
            ].map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                className="px-4 py-2 rounded-full text-sm transition-colors hover:bg-peach"
                style={{ color: '#9a7d6e', fontWeight: 600 }}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Auth actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle compact />
            {user ? (
              <>
                <Link
                  to={getDashboardLink()}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-colors hover:bg-peach"
                  style={{ color: '#4a3b32', fontWeight: 700, border: '1.5px solid #f0e6d8' }}
                >
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: '#fff0e6', color: '#e85d04', fontSize: 14 }}
                  >
                    <i className="ti ti-user" />
                  </span>
                  <span className="max-w-[140px] truncate">
                    {user?.customer?.fullName || user?.busOperator?.companyName || user?.email || 'Tài khoản'}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-5 py-2.5 rounded-full text-sm font-bold transition-all hover:bg-peach"
                  style={{ color: '#4a3b32', border: '1.5px solid #f0e6d8', fontWeight: 700, background: 'transparent', cursor: 'pointer' }}
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-5 py-2.5 rounded-full text-sm font-bold transition-all hover:bg-peach"
                  style={{ color: '#4a3b32', border: '1.5px solid #f0e6d8', fontWeight: 700 }}
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-full text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: '#e85d04', fontWeight: 700, boxShadow: '0 4px 16px rgba(232,93,4,0.35)' }}
                >
                  Đặt vé ngay
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Main content ── */}
      <main className="flex-1 page-enter">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer style={{ background: '#2c1f17' }} className="pt-16 pb-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: '#e85d04' }}
                >
                  <i className="ti ti-bus text-white" style={{ fontSize: 18 }} />
                </div>
                <span
                  className="text-xl font-bold text-white"
                  style={{ fontFamily: "'Quicksand', sans-serif" }}
                >
                  BusGo <span style={{ color: '#e85d04' }}>Việt Nam</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed mb-6" style={{ color: '#c4a898' }}>
                Hành trình của bạn, sứ mệnh của chúng tôi. Đặt vé xe khách an toàn và tiện lợi nhất Việt Nam 🚌
              </p>
              <div className="flex gap-3">
                {[
                  { icon: 'ti-brand-facebook', href: '#' },
                  { icon: 'ti-brand-instagram', href: '#' },
                  { icon: 'ti-brand-tiktok', href: '#' },
                  { icon: 'ti-brand-youtube', href: '#' },
                ].map(({ icon, href }) => (
                  <a
                    key={icon}
                    href={href}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/20"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                  >
                    <i className={`ti ${icon}`} style={{ color: '#c4a898', fontSize: 18 }} />
                  </a>
                ))}
              </div>
            </div>

            {/* Services */}
            <div>
              <h4
                className="font-bold mb-4 text-sm uppercase tracking-wide text-white"
                style={{ fontFamily: "'Quicksand', sans-serif", letterSpacing: '1px' }}
              >
                Dịch vụ
              </h4>
              <ul className="flex flex-col gap-3">
                {['Đặt vé xe khách', 'Tìm kiếm chuyến đi', 'Theo dõi xe trực tiếp', 'Hủy / Đổi vé', 'Vé xe tết'].map(
                  (item) => (
                    <li key={item}>
                      <a href="#" className="text-sm transition-colors hover:text-brand" style={{ color: '#c4a898' }}>
                        {item}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4
                className="font-bold mb-4 text-sm uppercase tracking-wide text-white"
                style={{ fontFamily: "'Quicksand', sans-serif", letterSpacing: '1px' }}
              >
                Hỗ trợ
              </h4>
              <ul className="flex flex-col gap-3">
                {[
                  'Trung tâm trợ giúp',
                  'Liên hệ chúng tôi',
                  'Chính sách hoàn tiền',
                  'Điều khoản sử dụng',
                  'Chính sách bảo mật',
                ].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm transition-colors hover:text-brand" style={{ color: '#c4a898' }}>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4
                className="font-bold mb-4 text-sm uppercase tracking-wide text-white"
                style={{ fontFamily: "'Quicksand', sans-serif", letterSpacing: '1px' }}
              >
                Liên hệ
              </h4>
              <ul className="flex flex-col gap-3">
                {[
                  { icon: 'ti-phone', text: '1800 1234' },
                  { icon: 'ti-mail', text: 'hello@busgovietnam.vn' },
                  { icon: 'ti-clock', text: '7:00 – 22:00 hàng ngày' },
                  { icon: 'ti-map-pin', text: '123 Lê Lợi, TP.HCM' },
                ].map(({ icon, text }) => (
                  <li key={text} className="flex items-center gap-2 text-sm" style={{ color: '#c4a898' }}>
                    <i className={`ti ${icon}`} style={{ color: '#e85d04', fontSize: 16 }} />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            className="pt-8 flex items-center justify-between flex-wrap gap-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
          >
            <p className="text-sm" style={{ color: '#9a7d6e' }}>
              © 2025 BusGo Việt Nam. Tất cả quyền được bảo lưu.
            </p>
            <p className="text-sm" style={{ color: '#9a7d6e' }}>
              Làm với ❤️ tại Việt Nam 🇻🇳
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
