import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, clearError } from '../../store/slices/authSlice';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, token } = useSelector(s => s.auth);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [localError, setLocalError] = useState(null);

  useEffect(() => { dispatch(clearError()); }, []);
  useEffect(() => { if (token) navigate('/dashboard', { replace: true }); }, [token]);

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
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🚌</div>
          <h1 className="text-2xl font-bold text-gray-800">Tạo tài khoản</h1>
          <p className="text-gray-500 text-sm mt-1">Đăng ký để đặt vé dễ dàng hơn</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Họ và tên *</label>
              <input className="input" placeholder="Nguyễn Văn A"
                value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" placeholder="email@example.com"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="label">Số điện thoại</label>
                <input className="input" placeholder="0901234567"
                  value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Mật khẩu *</label>
              <input className="input" type="password" placeholder="Ít nhất 6 ký tự"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div>
              <label className="label">Xác nhận mật khẩu *</label>
              <input className="input" type="password" placeholder="Nhập lại mật khẩu"
                value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
            </div>

            {displayError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {displayError}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Đang đăng ký...' : 'Tạo tài khoản'}
            </button>
          </form>

          <p className="text-center mt-4 text-sm text-gray-500">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-brand font-semibold hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
