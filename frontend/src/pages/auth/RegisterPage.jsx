import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, clearError } from '../../store/slices/authSlice';
import { Card, Input, Button } from '../../components/ui';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector(s => s.auth);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [localError, setLocalError] = useState(null);

  useEffect(() => { dispatch(clearError()); }, []);
  useEffect(() => { if (user) navigate('/dashboard', { replace: true }); }, [user, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError(null);
    if (form.password !== form.confirmPassword) {
      setLocalError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (form.password.length < 6) {
      setLocalError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    const { confirmPassword, ...data } = form;
    dispatch(register(data));
  };

  const displayError = localError || error;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md page-enter">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3 inline-block bg-orange-100 dark:bg-orange-900/30 p-4 rounded-full shadow-inner">🚌</div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Tạo tài khoản</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Đăng ký để đặt vé dễ dàng hơn</p>
        </div>

        <Card className="border-[#e85d04]/20 shadow-lg shadow-orange-900/5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input 
              label="Họ và tên" 
              placeholder="Nguyễn Văn A"
              value={form.fullName} 
              onChange={e => setForm({ ...form, fullName: e.target.value })} 
              required 
              icon="ti-id-badge"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input 
                label="Email" 
                type="email" 
                placeholder="email@example.com"
                value={form.email} 
                onChange={e => setForm({ ...form, email: e.target.value })} 
                icon="ti-mail"
              />
              <Input 
                label="Số điện thoại" 
                placeholder="0901234567"
                value={form.phone} 
                onChange={e => setForm({ ...form, phone: e.target.value })} 
                icon="ti-phone"
              />
            </div>
            <Input 
              label="Mật khẩu" 
              type="password" 
              placeholder="Ít nhất 6 ký tự"
              value={form.password} 
              onChange={e => setForm({ ...form, password: e.target.value })} 
              required 
              icon="ti-lock"
            />
            <Input 
              label="Xác nhận mật khẩu" 
              type="password" 
              placeholder="Nhập lại mật khẩu"
              value={form.confirmPassword} 
              onChange={e => setForm({ ...form, confirmPassword: e.target.value })} 
              required 
              icon="ti-lock-check"
            />

            {displayError && (
              <div className="text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl px-4 py-3 flex items-center gap-2">
                <i className="ti ti-alert-circle" /> {displayError}
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" disabled={loading} fullWidth size="lg" className="text-lg">
                {loading ? 'Đang đăng ký...' : 'Tạo tài khoản'}
              </Button>
            </div>
          </form>

          <div className="text-center mt-6 text-sm font-medium text-gray-600 dark:text-gray-400 pt-6 border-t border-gray-100 dark:border-slate-800">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-[#e85d04] font-bold hover:text-[#d05303] transition-colors hover:underline">
              Đăng nhập
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
