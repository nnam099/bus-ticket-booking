import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../../store/slices/authSlice';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, token, user } = useSelector(s => s.auth);
  const [form, setForm] = useState({ email: '', password: '' });

  useEffect(() => { dispatch(clearError()); }, []);

  useEffect(() => {
    if (token && user) {
      const roles = user.roles || [];
      if (roles.includes('ADMIN')) navigate('/admin', { replace: true });
      else if (roles.includes('BUS_OPERATOR')) navigate('/operator', { replace: true });
      else if (roles.includes('STAFF')) navigate('/staff', { replace: true });
      else navigate('/dashboard', { replace: true });
    }
  }, [token, user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(login(form));
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🚌</div>
          <h1 className="text-2xl font-bold text-gray-800">Đăng nhập BusTicket</h1>
          <p className="text-gray-500 text-sm mt-1">Chào mừng trở lại!</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email hoặc số điện thoại</label>
              <input className="input" type="text" placeholder="email@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required />
            </div>
            <div>
              <label className="label">Mật khẩu</label>
              <input className="input" type="password" placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <div className="text-center mt-4 text-sm text-gray-500 space-y-2">
            <div>
              <Link to="/forgot-password" className="text-brand hover:underline">
                Quên mật khẩu?
              </Link>
            </div>
            <div>
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-brand font-semibold hover:underline">
                Đăng ký ngay
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
