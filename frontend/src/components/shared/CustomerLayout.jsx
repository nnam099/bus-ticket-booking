// CustomerLayout.jsx
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';

export default function CustomerLayout() {
  const { user } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    { to: '/dashboard', label: '🏠 Trang chủ' },
    { to: '/my-tickets', label: '🎫 Vé của tôi' },
    { to: '/my-invoices', label: '🧾 Hóa đơn' },
    { to: '/lookup', label: '🔎 Tra cứu' },
    { to: '/profile', label: '👤 Hồ sơ' },
  ];

  const isActive = (path) => location.pathname.startsWith(path);
  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } finally {
      dispatch(logout());
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 relative overflow-hidden transition-colors duration-300">
      {/* Premium ambient background elements */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-brand/5 dark:bg-brand/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

      <nav className="bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl border-b border-white/50 dark:border-slate-800 shadow-sm sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 no-underline group shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-brand shadow-[0_4px_16px_rgba(232,93,4,0.35)] group-hover:scale-110 transition-transform duration-300">
              <i className="ti ti-bus text-white text-[18px]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold font-quicksand leading-tight text-mocha dark:text-slate-100 whitespace-nowrap">
                BusGo <span className="text-brand">Việt Nam</span>
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand">Khách Hàng</span>
            </div>
          </Link>
          <div className="flex items-center gap-3 lg:gap-6 text-sm font-semibold overflow-x-auto hide-scrollbar">
            {links.map(l => (
              <Link key={l.to} to={l.to}
                className={`relative py-2 text-gray-600 dark:text-slate-300 hover:text-brand dark:hover:text-brand transition-colors duration-300 group whitespace-nowrap shrink-0`}>
                {l.label}
                <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-brand transform origin-left transition-transform duration-300 ${isActive(l.to) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
              </Link>
            ))}
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <NotificationBell />
              <ThemeToggle compact />
              <button onClick={handleLogout}
                className="flex items-center gap-2 px-4 lg:px-5 py-2 lg:py-2.5 rounded-full bg-gray-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 border border-gray-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-500/50 transition-all duration-300 shadow-sm hover:shadow-md whitespace-nowrap">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 lg:px-6 py-10 relative z-10 page-enter">
        <Outlet />
      </main>
    </div>
  );
}
