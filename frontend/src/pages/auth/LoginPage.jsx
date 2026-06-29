import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../../store/slices/authSlice';
import { Card, Input, Button } from '../../components/ui';
import { Bus } from 'lucide-react';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector(s => s.auth);
  const [form, setForm] = useState({ identifier: '', password: '' });

  useEffect(() => { dispatch(clearError()); }, []);

  useEffect(() => {
    if (user) {
      const roles = user.roles || [];
      if (roles.includes('ADMIN')) navigate('/admin', { replace: true });
      else if (roles.includes('BUS_OPERATOR')) navigate('/operator', { replace: true });
      else if (roles.includes('STAFF')) navigate('/staff', { replace: true });
      else navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(login(form));
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md page-enter">
        <div className="text-center mb-8">
          <div className="mb-4 inline-flex bg-orange-100 dark:bg-orange-900/30 p-4 rounded-full shadow-inner text-orange-600 dark:text-orange-400">
            <Bus className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Đăng nhập BusTicket</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Chào mừng bạn quay trở lại!</p>
        </div>

        <Card className="border-[#e85d04]/20 shadow-lg shadow-orange-900/5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input 
              label="Email hoặc số điện thoại" 
              type="text" 
              placeholder="email@example.com"
              value={form.identifier}
              onChange={e => setForm({ ...form, identifier: e.target.value })}
              required 
              icon="ti-user"
            />
            <Input 
              label="Mật khẩu" 
              type="password" 
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required 
              icon="ti-lock"
            />

            {error && (
              <div className="text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl px-4 py-3 flex items-center gap-2">
                <i className="ti ti-alert-circle" /> {error}
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" disabled={loading} fullWidth size="lg" className="text-lg">
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>
            </div>
          </form>

          <div className="text-center mt-6 text-sm font-medium text-gray-600 dark:text-gray-400 space-y-3 pt-6 border-t border-gray-100 dark:border-slate-800">
            <div>
              <Link to="/forgot-password" className="text-[#e85d04] hover:text-[#d05303] transition-colors hover:underline">
                Quên mật khẩu?
              </Link>
            </div>
            <div>
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-[#e85d04] font-bold hover:text-[#d05303] transition-colors hover:underline">
                Đăng ký ngay
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
