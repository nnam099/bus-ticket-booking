import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, registerOperator, clearError } from '../../store/slices/authSlice';
import { Card, Input, Button } from '../../components/ui';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector(s => s.auth);
  
  const [role, setRole] = useState('CUSTOMER'); // CUSTOMER | OPERATOR
  const [form, setForm] = useState({ 
    fullName: '', 
    email: '', 
    phone: '', 
    password: '', 
    confirmPassword: '',
    companyName: '',
    licenseNumber: '',
    hotline: '',
    address: ''
  });
  const [localError, setLocalError] = useState(null);
  const [operatorSuccess, setOperatorSuccess] = useState(false);

  useEffect(() => { dispatch(clearError()); }, [dispatch]);
  useEffect(() => { 
    if (user && role === 'CUSTOMER') navigate('/dashboard', { replace: true }); 
  }, [user, navigate, role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setOperatorSuccess(false);

    if (form.password !== form.confirmPassword) {
      setLocalError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (form.password.length < 6) {
      setLocalError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    const { confirmPassword, ...data } = form;
    
    if (role === 'CUSTOMER') {
      dispatch(register({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        password: data.password
      }));
    } else {
      const res = await dispatch(registerOperator({
        companyName: data.companyName,
        licenseNumber: data.licenseNumber,
        hotline: data.hotline,
        address: data.address,
        email: data.email,
        phone: data.phone,
        password: data.password
      }));
      if (!res.error) {
        setOperatorSuccess(true);
        setForm({ ...form, password: '', confirmPassword: '' }); // Clear password for security
      }
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md page-enter">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3 inline-block bg-orange-100 dark:bg-orange-900/30 p-4 rounded-full shadow-inner">
            {role === 'CUSTOMER' ? '🚌' : '🏢'}
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            {role === 'CUSTOMER' ? 'Tạo tài khoản' : 'Đăng ký Nhà xe'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
            {role === 'CUSTOMER' ? 'Đăng ký để đặt vé dễ dàng hơn' : 'Trở thành đối tác của BusGo Việt Nam'}
          </p>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => { setRole('CUSTOMER'); setLocalError(null); setOperatorSuccess(false); dispatch(clearError()); }}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
              role === 'CUSTOMER'
                ? 'bg-[#e85d04] text-white shadow-md'
                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 border border-gray-200 dark:border-white/10'
            }`}
          >
            Hành khách
          </button>
          <button
            onClick={() => { setRole('OPERATOR'); setLocalError(null); dispatch(clearError()); }}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
              role === 'OPERATOR'
                ? 'bg-[#e85d04] text-white shadow-md'
                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 border border-gray-200 dark:border-white/10'
            }`}
          >
            Đối tác nhà xe
          </button>
        </div>

        <Card className="border-[#e85d04]/20 shadow-lg shadow-orange-900/5">
          {operatorSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                <i className="ti ti-check" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Đăng ký thành công!</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Hồ sơ nhà xe của bạn đã được gửi. Quản trị viên sẽ xem xét và phê duyệt trong thời gian sớm nhất. Bạn có thể đăng nhập sau khi hồ sơ được duyệt.
              </p>
              <Button fullWidth onClick={() => navigate('/login')} className="mt-4">
                Quay lại Đăng nhập
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {role === 'CUSTOMER' && (
                <Input 
                  label="Họ và tên" 
                  placeholder="Nguyễn Văn A"
                  value={form.fullName} 
                  onChange={e => setForm({ ...form, fullName: e.target.value })} 
                  required 
                  icon="ti-id-badge"
                />
              )}

              {role === 'OPERATOR' && (
                <>
                  <Input 
                    label="Tên nhà xe / Công ty" 
                    placeholder="VD: Nhà xe Hoàng Long"
                    value={form.companyName} 
                    onChange={e => setForm({ ...form, companyName: e.target.value })} 
                    required 
                    icon="ti-building"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input 
                      label="Hotline đặt vé" 
                      placeholder="1900 xxxx"
                      value={form.hotline} 
                      onChange={e => setForm({ ...form, hotline: e.target.value })} 
                      required 
                      icon="ti-headset"
                    />
                    <Input 
                      label="Mã số kinh doanh" 
                      placeholder="VD: 0101234567"
                      value={form.licenseNumber} 
                      onChange={e => setForm({ ...form, licenseNumber: e.target.value })} 
                      required 
                      icon="ti-file-certificate"
                    />
                  </div>
                  <Input 
                    label="Địa chỉ văn phòng chính" 
                    placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                    value={form.address} 
                    onChange={e => setForm({ ...form, address: e.target.value })} 
                    required 
                    icon="ti-map-pin"
                  />
                </>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input 
                  label={role === 'OPERATOR' ? 'Email quản lý' : 'Email'}
                  type="email" 
                  placeholder="email@example.com"
                  value={form.email} 
                  onChange={e => setForm({ ...form, email: e.target.value })} 
                  icon="ti-mail"
                />
                <Input 
                  label={role === 'OPERATOR' ? 'SĐT quản lý' : 'Số điện thoại'} 
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
                  {loading ? 'Đang xử lý...' : (role === 'CUSTOMER' ? 'Tạo tài khoản' : 'Gửi yêu cầu đăng ký')}
                </Button>
              </div>
            </form>
          )}

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
