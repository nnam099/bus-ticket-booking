import { Outlet, Link, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';

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
    { to: '/admin', label: 'Tong quan' },
    { to: '/admin/operators', label: 'Nha xe' },
    { to: '/admin/users', label: 'Nguoi dung' },
    { to: '/admin/reviews', label: 'Danh gia' },
    { to: '/admin/audit', label: 'Audit Log' },
  ];

  return (
    <div className="admin-light-shell min-h-screen w-full flex bg-gray-50 text-gray-900">
      <aside className="admin-surface w-56 shrink-0 border-r border-gray-200 bg-white text-gray-700 flex flex-col">
        <div className="border-b border-gray-200 px-4 py-5">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-gray-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-xs font-black text-white">BT</span>
            BusTicket
          </Link>
          <p className="mt-1 text-xs text-red-600">Admin Panel</p>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(l.to)
                  ? 'bg-red-50 text-red-700 ring-1 ring-red-100'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="mx-2 mb-4 px-3 py-2 text-sm rounded-lg text-left text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
        >
          Dang xuat
        </button>
      </aside>
      <main className="min-w-0 flex-1 bg-gray-50 p-6 overflow-auto page-enter">
        <Outlet />
      </main>
    </div>
  );
}
