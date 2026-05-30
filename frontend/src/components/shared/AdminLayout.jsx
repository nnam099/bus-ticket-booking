import { Outlet, Link, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import ThemeToggle from './ThemeToggle';

export default function AdminLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
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
    { to: '/admin', label: '📊 Tổng quan' },
    { to: '/admin/operators', label: '🏢 Nhà xe' },
    { to: '/admin/users', label: '👥 Người dùng' },
    { to: '/admin/reviews', label: '⭐ Đánh giá' },
    { to: '/admin/audit', label: '🔍 Audit Log' },
  ];

  return (
    <div className="min-h-screen flex">
      <aside className="sidebar-nav w-56 flex flex-col">
        <div className="px-4 py-5 border-b border-sidebar-border">
          <Link to="/" className="sidebar-title font-bold text-lg">🚌 BusTicket</Link>
          <p className="text-xs text-red-400 mt-0.5">Admin Panel</p>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {links.map(l => (
            <Link key={l.to} to={l.to}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                ${isActive(l.to) ? 'bg-red-600 text-white' : 'sidebar-link'}`}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mx-2 mb-3">
          <ThemeToggle />
        </div>
        <button onClick={handleLogout}
          className="mx-2 mb-4 px-3 py-2 text-sm sidebar-link rounded-lg transition text-left">
          🚪 Đăng xuất
        </button>
      </aside>
      <main className="flex-1 bg-gray-50 p-6 overflow-auto page-enter">
        <Outlet />
      </main>
    </div>
  );
}
