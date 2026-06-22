import { Outlet, Link, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../../contexts/ThemeContext';

export default function StaffLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } finally {
      dispatch(logout());
      navigate('/');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-sand text-mocha'}`}>
      <nav className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-all duration-300 ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-mocha-border shadow-sm'}`}>
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/staff" className="flex items-center gap-2 no-underline">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-brand shadow-[0_4px_16px_rgba(232,93,4,0.35)]">
              <i className="ti ti-bus text-white text-[18px]" />
            </div>
            <div className="flex flex-col">
              <span className={`text-xl font-bold font-quicksand leading-tight ${isDark ? 'text-white' : 'text-[#4a3b32]'}`}>
                BusGo <span className="text-brand">Việt Nam</span>
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand">Cổng Nhân Viên</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/staff/profile" className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-2xl transition-all duration-300 ${
              isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-mocha-light hover:text-brand hover:bg-peach'
            }`}>
              <i className="ti ti-user text-[18px]" />
              <span className="hidden sm:inline">Hồ sơ</span>
            </Link>
            <ThemeToggle compact />
            <button onClick={handleLogout}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-2xl transition-all duration-300 ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white' : 'bg-peach hover:bg-[#ffe0cc] text-brand border-[1.5px] border-transparent hover:border-mocha-accent'
              }`}>
              <i className="ti ti-logout text-[18px]" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </nav>
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 page-enter">
        <Outlet />
      </main>
    </div>
  );
}
