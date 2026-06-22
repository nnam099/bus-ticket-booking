import { Outlet, Link, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../../contexts/ThemeContext';

export default function AdminLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } finally {
      dispatch(logout());
      navigate('/');
    }
  };

  const links = [
    { to: '/admin', label: 'Tổng quan', icon: 'ti-layout-dashboard' },
    { to: '/admin/operators', label: 'Nhà xe', icon: 'ti-building' },
    { to: '/admin/users', label: 'Người dùng', icon: 'ti-users' },
    { to: '/admin/reviews', label: 'Đánh giá', icon: 'ti-star' },
    { to: '/admin/audit', label: 'Nhật ký', icon: 'ti-history' },
    { to: '/admin/profile', label: 'Hồ sơ cá nhân', icon: 'ti-user' },
  ];

  return (
    <div className={`min-h-screen w-full flex ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-[#fdfbf7] text-mocha'}`}>
      <aside className={`w-64 shrink-0 flex flex-col border-r transition-colors ${isDark ? 'border-slate-800 bg-slate-950 text-slate-300' : 'border-[#f0e6d8] bg-white text-mocha'}`}>
        <div className={`border-b px-6 py-6 ${isDark ? 'border-slate-800' : 'border-[#f0e6d8]'}`}>
          <Link to="/" className="flex items-center gap-2 no-underline">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-brand shadow-[0_4px_16px_rgba(232,93,4,0.35)]">
              <i className="ti ti-bus text-white text-[18px]" />
            </div>
            <div className="flex flex-col">
              <span className={`text-xl font-bold font-quicksand leading-tight ${isDark ? 'text-white' : 'text-[#4a3b32]'}`}>
                BusGo <span className="text-brand">Việt Nam</span>
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand">Cổng Quản Trị</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {links.map(l => {
            const active = isActive(l.to);
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${
                  active
                    ? 'bg-brand text-white shadow-[0_8px_24px_rgba(232,93,4,0.35)]'
                    : isDark 
                      ? 'text-slate-400 hover:bg-slate-800 hover:text-white' 
                      : 'text-mocha-light hover:bg-peach hover:text-brand'
                }`}
              >
                <i className={`ti ${l.icon} text-[20px] ${active ? 'text-white' : ''}`} />
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 mb-4">
          <ThemeToggle />
        </div>
        <div className="px-4 mb-6">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl transition-all duration-300 ${
              isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-mocha-light hover:bg-peach hover:text-brand border-[1.5px] border-transparent hover:border-mocha-accent'
            }`}
          >
            <i className="ti ti-logout text-[20px]" />
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className={`min-w-0 flex-1 p-8 overflow-auto page-enter ${isDark ? 'bg-slate-900' : 'bg-[#fdfbf7]'}`}>
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
