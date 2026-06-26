import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { authAPI } from '../../services/api';
import ThemeToggle from './ThemeToggle';

// ── Modal: Giới thiệu BusGo Việt Nam ──────────────────────────────────────────
function AboutModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-lg rounded-3xl bg-white dark:bg-slate-800 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-[#e85d04] to-[#f4a261] px-8 py-8 text-center text-white">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
            <i className="ti ti-bus text-white" style={{ fontSize: 32 }} />
          </div>
          <h2 className="text-2xl font-black" style={{ fontFamily: "'Quicksand', sans-serif" }}>
            BusGo <span className="text-white/80">Việt Nam</span>
          </h2>
          <p className="mt-2 text-sm text-white/80">Hành trình của bạn, sứ mệnh của chúng tôi 🚌</p>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-4 text-sm text-gray-600 dark:text-gray-300">
          <p>
            <strong className="text-gray-800 dark:text-gray-100">BusGo Việt Nam</strong> là nền tảng
            đặt vé xe khách trực tuyến hàng đầu, kết nối hành khách với hàng trăm nhà xe uy tín
            trên toàn quốc.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: 'ti-route', label: '500+ tuyến đường', sub: 'Phủ sóng toàn quốc' },
              { icon: 'ti-building', label: '100+ nhà xe', sub: 'Đối tác uy tín' },
              { icon: 'ti-shield-check', label: 'Thanh toán an toàn', sub: 'Mã hóa 256-bit' },
              { icon: 'ti-headset', label: 'Hỗ trợ 24/7', sub: 'Hotline 1800 1234' },
            ].map(({ icon, label, sub }) => (
              <div key={label} className="flex items-start gap-3 rounded-2xl bg-orange-50 dark:bg-slate-700 p-3">
                <i className={`ti ${icon} text-[#e85d04]`} style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p className="font-bold text-gray-800 dark:text-gray-100 text-xs">{label}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center pt-2">
            © 2025 BusGo Việt Nam · Địa chỉ: 123 Lê Lợi, TP.HCM · Email: hello@busgovietnam.vn
          </p>
        </div>

        <div className="px-8 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-[#e85d04] text-white font-bold text-sm hover:opacity-90 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal: Hỗ trợ ─────────────────────────────────────────────────────────────
function SupportModal({ onClose }) {
  const steps = [
    { num: '1', title: 'Tìm chuyến', desc: 'Nhập điểm đi, điểm đến và ngày khởi hành trên trang chủ.' },
    { num: '2', title: 'Chọn ghế', desc: 'Xem sơ đồ ghế, chọn vị trí phù hợp với bạn.' },
    { num: '3', title: 'Nhập thông tin', desc: 'Điền tên hành khách và số điện thoại liên hệ.' },
    { num: '4', title: 'Thanh toán', desc: 'Thanh toán qua ví điện tử, thẻ ngân hàng hoặc tiền mặt.' },
    { num: '5', title: 'Nhận vé', desc: 'Vé điện tử và mã QR được gửi về mục "Vé của tôi".' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-lg rounded-3xl bg-white dark:bg-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-[#2c1f17] to-[#4a3b32] px-8 py-6 text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#e85d04] flex items-center justify-center">
              <i className="ti ti-headset text-white" style={{ fontSize: 24 }} />
            </div>
            <div>
              <h2 className="text-xl font-black" style={{ fontFamily: "'Quicksand', sans-serif" }}>Trung tâm hỗ trợ</h2>
              <p className="text-sm text-white/60">BusGo Việt Nam</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-5 overflow-y-auto flex-1">
          {/* Hotline */}
          <div className="rounded-2xl border-2 border-[#e85d04]/30 bg-orange-50 dark:bg-slate-700 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">Liên hệ trực tiếp</p>
            <div className="space-y-2">
              {[
                { icon: 'ti-phone', label: 'Hotline (miễn phí)', val: '1800 1234', href: 'tel:18001234', bold: true },
                { icon: 'ti-clock', label: 'Giờ làm việc', val: '7:00 – 22:00 mỗi ngày' },
                { icon: 'ti-mail', label: 'Email hỗ trợ', val: 'hello@busgovietnam.vn', href: 'mailto:hello@busgovietnam.vn' },
              ].map(({ icon, label, val, href, bold }) => (
                <div key={label} className="flex items-center gap-3">
                  <i className={`ti ${icon} text-[#e85d04]`} style={{ fontSize: 18, width: 20, flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{label}: </span>
                    {href ? (
                      <a href={href} className={`text-sm hover:underline text-[#e85d04] ${bold ? 'font-black text-base' : 'font-semibold'}`}>{val}</a>
                    ) : (
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{val}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cách đặt vé */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">Cách đặt vé xe</p>
            <div className="space-y-2">
              {steps.map(({ num, title, desc }) => (
                <div key={num} className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-[#e85d04] text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">{num}</span>
                  <div>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chính sách hủy */}
          <div className="rounded-2xl bg-gray-50 dark:bg-slate-700 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Chính sách hủy vé</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Hủy trước <strong>3 ngày</strong> khởi hành: hoàn <strong>90%</strong> tiền vé.
              Hủy sau thời hạn: không được hoàn tiền.
            </p>
          </div>
        </div>

        <div className="px-8 pb-6 pt-2 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-[#2c1f17] text-white font-bold text-sm hover:opacity-80 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Layout ───────────────────────────────────────────────────────────────
export default function PublicLayout() {
  const { user } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [showAbout, setShowAbout] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  // Redirect internal roles away from public pages
  if (user?.roles) {
    if (user.roles.includes('ADMIN')) return <Navigate to="/admin" replace />;
    if (user.roles.includes('BUS_OPERATOR')) return <Navigate to="/operator" replace />;
    if (user.roles.includes('STAFF')) return <Navigate to="/staff" replace />;
  }

  const handleLogout = async () => {
    try { await authAPI.logout(); } finally {
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

  // Khi click "Trang chủ" mà đang ở trang chủ → mở modal giới thiệu
  const handleHomeClick = (e) => {
    if (location.pathname === '/') {
      e.preventDefault();
      setShowAbout(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfbf7] dark:bg-slate-900 transition-colors duration-300" style={{ fontFamily: "'Nunito', sans-serif" }}>
      {/* Modals */}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      {showSupport && <SupportModal onClose={() => setShowSupport(false)} />}

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 w-full backdrop-blur-md border-b-[1.5px] border-[#f0e6d8] dark:border-slate-800 bg-[#fdfbf7]/90 dark:bg-slate-900/90 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 no-underline">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#e85d04]">
              <i className="ti ti-bus text-white" style={{ fontSize: 18 }} />
            </div>
            <span className="text-xl font-bold text-[#4a3b32] dark:text-gray-100 transition-colors duration-300" style={{ fontFamily: "'Quicksand', sans-serif" }}>
              BusGo <span className="text-[#e85d04]">Việt Nam</span>
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              onClick={handleHomeClick}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-colors text-[#9a7d6e] dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-slate-800"
            >
              Trang chủ
            </Link>
            <Link
              to="/lookup"
              className="px-4 py-2 rounded-full text-sm font-semibold transition-colors text-[#9a7d6e] dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-slate-800"
            >
              Tra cứu vé
            </Link>
            <button
              onClick={() => setShowSupport(true)}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-colors text-[#9a7d6e] dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-slate-800 cursor-pointer bg-transparent border-none"
            >
              Hỗ trợ
            </button>
          </div>

          {/* Auth actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle compact />
            {user ? (
              <>
                <Link
                  to={getDashboardLink()}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-colors hover:bg-orange-50 dark:hover:bg-slate-800 border-[1.5px] border-[#f0e6d8] dark:border-slate-700 text-[#4a3b32] dark:text-gray-200"
                >
                  <span className="w-7 h-7 rounded-full flex items-center justify-center bg-[#fff0e6] dark:bg-slate-800 text-[#e85d04] text-[14px]">
                    <i className="ti ti-user" />
                  </span>
                  <span className="max-w-[140px] truncate">
                    {user?.customer?.fullName || user?.busOperator?.companyName || user?.email || 'Tài khoản'}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-5 py-2.5 rounded-full text-sm font-bold transition-all hover:bg-orange-50 dark:hover:bg-slate-800 border-[1.5px] border-[#f0e6d8] dark:border-slate-700 text-[#4a3b32] dark:text-gray-200 bg-transparent cursor-pointer"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-5 py-2.5 rounded-full text-sm font-bold transition-all hover:bg-orange-50 dark:hover:bg-slate-800 border-[1.5px] border-[#f0e6d8] dark:border-slate-700 text-[#4a3b32] dark:text-gray-200"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-full text-sm font-bold text-white transition-all hover:opacity-90 bg-[#e85d04] shadow-[0_4px_16px_rgba(232,93,4,0.35)]"
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
      <footer className="pt-16 pb-8 px-6 bg-[#2c1f17] dark:bg-slate-950 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#e85d04' }}>
                  <i className="ti ti-bus text-white" style={{ fontSize: 18 }} />
                </div>
                <span className="text-xl font-bold text-white" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                  BusGo <span style={{ color: '#e85d04' }}>Việt Nam</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#c4a898' }}>
                Hành trình của bạn, sứ mệnh của chúng tôi. Đặt vé xe khách an toàn và tiện lợi nhất Việt Nam 🚌
              </p>
            </div>

            {/* Cách đặt vé nhanh */}
            <div>
              <h4 className="font-bold mb-4 text-sm uppercase tracking-wide text-white" style={{ fontFamily: "'Quicksand', sans-serif", letterSpacing: '1px' }}>
                Cách đặt vé
              </h4>
              <ol className="flex flex-col gap-2">
                {['Tìm chuyến xe trên trang chủ', 'Chọn ghế ngồi phù hợp', 'Nhập thông tin hành khách', 'Thanh toán online hoặc tiền mặt', 'Nhận vé QR điện tử'].map((item, i) => (
                  <li key={item} className="flex items-start gap-2 text-sm" style={{ color: '#c4a898' }}>
                    <span className="w-5 h-5 rounded-full bg-[#e85d04] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    {item}
                  </li>
                ))}
              </ol>
            </div>

            {/* Hỗ trợ */}
            <div>
              <h4 className="font-bold mb-4 text-sm uppercase tracking-wide text-white" style={{ fontFamily: "'Quicksand', sans-serif", letterSpacing: '1px' }}>
                Hỗ trợ
              </h4>
              <ul className="flex flex-col gap-3">
                {[
                  { label: 'Trung tâm trợ giúp', to: '/help' },
                  { label: 'Liên hệ chúng tôi', to: '/contact' },
                  { label: 'Chính sách hoàn tiền', to: '/refund-policy' },
                  { label: 'Điều khoản sử dụng', to: '/terms' },
                  { label: 'Chính sách bảo mật', to: '/privacy' },
                ].map(({ label, to }) => (
                  <li key={to}>
                    <Link to={to} className="text-sm transition-colors hover:text-[#e85d04]" style={{ color: '#c4a898' }}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold mb-4 text-sm uppercase tracking-wide text-white" style={{ fontFamily: "'Quicksand', sans-serif", letterSpacing: '1px' }}>
                Liên hệ
              </h4>
              <ul className="flex flex-col gap-3">
                {[
                  { icon: 'ti-phone', text: 'Hotline miễn phí: 1800 1234' },
                  { icon: 'ti-clock', text: '7:00 – 22:00 hàng ngày' },
                  { icon: 'ti-mail', text: 'hello@busgovietnam.vn' },
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
          <div className="pt-8 flex items-center justify-between flex-wrap gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-sm" style={{ color: '#9a7d6e' }}>© 2025 BusGo Việt Nam. Tất cả quyền được bảo lưu.</p>
            <div className="flex flex-wrap gap-4">
              {[
                { label: 'Điều khoản', to: '/terms' },
                { label: 'Bảo mật', to: '/privacy' },
                { label: 'Hoàn tiền', to: '/refund-policy' },
              ].map(({ label, to }) => (
                <Link key={to} to={to} className="text-sm hover:text-[#e85d04] transition-colors" style={{ color: '#9a7d6e' }}>{label}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
