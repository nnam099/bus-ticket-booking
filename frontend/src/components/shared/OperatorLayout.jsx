import { Outlet, Link, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

export default function OperatorLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const links = [
    { to: '/operator', label: '📊 Dashboard' },
    { to: '/operator/vehicles', label: '🚌 Xe' },
    { to: '/operator/routes', label: '🗺️ Tuyến xe' },
    { to: '/operator/trips', label: '📅 Chuyến xe' },
    { to: '/operator/reports', label: '📈 Báo cáo' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 text-gray-300 flex flex-col">
        <div className="px-4 py-5 border-b border-gray-700">
          <Link to="/" className="text-white font-bold text-lg">🚌 BusTicket</Link>
          <p className="text-xs text-gray-400 mt-0.5">Cổng Nhà Xe</p>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {links.map(l => (
            <Link key={l.to} to={l.to}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                ${isActive(l.to) ? 'bg-brand text-white' : 'hover:bg-gray-800 hover:text-white'}`}>
              {l.label}
            </Link>
          ))}
        </nav>
        <button onClick={() => { dispatch(logout()); navigate('/'); }}
          className="mx-2 mb-4 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition text-left">
          🚪 Đăng xuất
        </button>
      </aside>
      {/* Main */}
      <main className="flex-1 bg-gray-50 p-6 overflow-auto page-enter">
        <Outlet />
      </main>
    </div>
  );
}
