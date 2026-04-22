import { Outlet, Link, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

export default function StaffLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-blue-700 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/staff" className="font-bold text-lg">🚌 BusTicket — Nhân viên</Link>
          <button onClick={() => { dispatch(logout()); navigate('/'); }}
            className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-sm transition">
            Đăng xuất
          </button>
        </div>
      </nav>
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 page-enter">
        <Outlet />
      </main>
    </div>
  );
}
