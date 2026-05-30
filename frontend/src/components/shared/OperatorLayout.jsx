import { Outlet, Link, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../../contexts/ThemeContext';

export default function OperatorLayout() {
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
    { to: '/operator',          label: '📊 Dashboard' },
    { to: '/operator/vehicles', label: '🚌 Xe' },
    { to: '/operator/routes',   label: '🗺️ Tuyến xe' },
    { to: '/operator/trips',    label: '📅 Chuyến xe' },
    { to: '/operator/reports',  label: '📈 Báo cáo' },
  ];

  const sidebarBg   = isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const sidebarText = isDark ? 'text-gray-300' : 'text-gray-700';
  const titleColor  = isDark ? 'text-white' : 'text-gray-900';
  const subColor    = isDark ? 'text-gray-400' : 'text-gray-500';
  const linkHover   = isDark ? 'hover:bg-gray-800 hover:text-white' : 'hover:bg-gray-100 hover:text-gray-900';
  const logoutColor = isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100';
  const mainBg      = isDark ? 'bg-gray-950' : 'bg-gray-50';

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className={`w-56 border-r flex flex-col ${sidebarBg} ${sidebarText}`}>
        <div className={`px-4 py-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <Link to="/" className={`font-bold text-lg ${titleColor}`}>🚌 BusTicket</Link>
          <p className={`text-xs mt-0.5 ${subColor}`}>Cổng Nhà Xe</p>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {links.map(l => (
            <Link key={l.to} to={l.to}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                ${isActive(l.to) ? 'bg-brand text-white' : `${sidebarText} ${linkHover}`}`}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mx-2 mb-3">
          <ThemeToggle />
        </div>
        <button onClick={handleLogout}
          className={`mx-2 mb-4 px-3 py-2 text-sm rounded-lg transition text-left ${logoutColor}`}>
          🚪 Đăng xuất
        </button>
      </aside>
      {/* Main */}
      <main className={`flex-1 ${mainBg} p-6 overflow-auto page-enter`}>
        <Outlet />
      </main>
    </div>
  );
}
