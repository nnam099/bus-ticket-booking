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
    { to: '/admin', label: 'Tổng quan' },
    { to: '/admin/operators', label: 'Nhà xe' },
    { to: '/admin/users', label: 'Người dùng' },
    { to: '/admin/reviews', label: 'Đánh giá' },
    { to: '/admin/audit', label: 'Nhật ký kiểm toán' },
  ];

  return (
    <div className={`admin-theme-shell min-h-screen w-full flex ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-gray-50 text-gray-900'}`}>
      <aside className={`admin-surface w-56 shrink-0 border-r flex flex-col ${isDark ? 'border-slate-800 bg-slate-950 text-slate-300' : 'border-gray-200 bg-white text-gray-700'}`}>
        <div className={`border-b px-4 py-5 ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
          <Link to="/" className={`flex items-center gap-2 font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-xs font-black text-white">BT</span>
            BusTicket
          </Link>
          <p className="mt-1 text-xs text-red-600">Bảng quản trị</p>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(l.to)
                  ? isDark ? 'bg-red-600 text-white shadow-sm shadow-red-950/30' : 'bg-red-50 text-red-700 ring-1 ring-red-100'
                  : isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mx-2 mb-3">
          <ThemeToggle />
        </div>
        <button
          onClick={handleLogout}
          className={`mx-2 mb-4 px-3 py-2 text-sm rounded-lg text-left transition ${isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
        >
          Đăng xuất
        </button>
      </aside>
      <main className={`min-w-0 flex-1 p-6 overflow-auto page-enter ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
        <Outlet />
      </main>
    </div>
  );
}
