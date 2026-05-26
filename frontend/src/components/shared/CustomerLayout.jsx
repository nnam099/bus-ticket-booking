// CustomerLayout.jsx
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';

export default function CustomerLayout() {
  const { user } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    { to: '/dashboard', label: '🏠 Trang chủ' },
    { to: '/my-tickets', label: '🎫 Vé của tôi' },
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
    <div className="min-h-screen flex flex-col bg-slate-50 relative overflow-hidden">
      {/* Premium ambient background elements */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-brand/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

      <nav className="bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-2xl drop-shadow-sm group-hover:scale-110 transition-transform duration-300">🚌</span>
            <span className="font-black text-xl tracking-tight text-gray-800">
              Bus<span className="text-brand">Ticket</span>
            </span>
          </Link>
          <div className="flex items-center gap-8 text-sm font-semibold">
            {links.map(l => (
              <Link key={l.to} to={l.to}
                className={`relative py-2 text-gray-600 hover:text-brand transition-colors duration-300 group`}>
                {l.label}
                <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-brand transform origin-left transition-transform duration-300 ${isActive(l.to) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
              </Link>
            ))}
            <button onClick={handleLogout}
              className="ml-2 flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-200 hover:border-red-200 transition-all duration-300 shadow-sm hover:shadow-md">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Đăng xuất
            </button>
          </div>
        </div>
      </nav>
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 relative z-10 page-enter">
        <Outlet />
      </main>
    </div>
  );
}
