// CustomerLayout.jsx
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

export default function CustomerLayout() {
  const { user } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    { to: '/dashboard', label: '🏠 Trang chủ' },
    { to: '/my-tickets', label: '🎫 Vé của tôi' },
    { to: '/profile', label: '👤 Hồ sơ' },
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-brand text-white shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-bold text-lg">🚌 BusTicket</Link>
          <div className="flex items-center gap-4 text-sm">
            {links.map(l => (
              <Link key={l.to} to={l.to}
                className={`hover:text-primary-100 transition-colors ${isActive(l.to) ? 'font-bold underline underline-offset-4' : ''}`}>
                {l.label}
              </Link>
            ))}
            <button onClick={() => { dispatch(logout()); navigate('/'); }}
              className="ml-2 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition">
              Đăng xuất
            </button>
          </div>
        </div>
      </nav>
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 page-enter">
        <Outlet />
      </main>
    </div>
  );
}
