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
  
  const [fieldErrors, setFieldErrors] = useState({});
  const [localError, setLocalError] = useState(null);
  const [operatorSuccess, setOperatorSuccess] = useState(false);

  useEffect(() => { dispatch(clearError()); }, [dispatch]);
  useEffect(() => { 
    if (user && role === 'CUSTOMER') navigate('/dashboard', { replace: true }); 
  }, [user, navigate, role]);

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Vietnam phone format: 03, 05, 07, 08, 09 followed by 8 digits
    const phoneRegex = /^(0)(3|5|7|8|9)[0-9]{8}$/;
    const numberRegex = /^[0-9]+$/;

    // Validate based on role
    if (role === 'CUSTOMER') {
      if (!form.fullName.trim()) errors.fullName = 'Họ và tên không được để trống';
      else if (form.fullName.length > 50) errors.fullName = 'Họ và tên không vượt quá 50 ký tự';
    } else {
      if (!form.companyName.trim()) errors.companyName = 'Tên nhà xe không được để trống';
      else if (form.companyName.length > 100) errors.companyName = 'Tên nhà xe không vượt quá 100 ký tự';

      if (!form.hotline.trim()) errors.hotline = 'Hotline không được để trống';
      else if (!numberRegex.test(form.hotline)) errors.hotline = 'Hotline chỉ bao gồm chữ số';
      else if (form.hotline.length < 8 || form.hotline.length > 12) errors.hotline = 'Hotline phải từ 8-12 chữ số';

      if (!form.licenseNumber.trim()) errors.licenseNumber = 'Mã số kinh doanh không được để trống';
      else if (!numberRegex.test(form.licenseNumber)) errors.licenseNumber = 'Mã số kinh doanh chỉ bao gồm chữ số';
      else if (form.licenseNumber.length < 10 || form.licenseNumber.length > 15) errors.licenseNumber = 'Mã số kinh doanh từ 10-15 chữ số';

      if (!form.address.trim()) errors.address = 'Địa chỉ không được để trống';
      else if (form.address.length > 200) errors.address = 'Địa chỉ không vượt quá 200 ký tự';
    }

    // Common fields
    if (!form.email.trim()) errors.email = 'Email không được để trống';
    else if (!emailRegex.test(form.email)) errors.email = 'Email không đúng định dạng';
    else if (form.email.length > 100) errors.email = 'Email không vượt quá 100 ký tự';

    if (!form.phone.trim()) errors.phone = 'Số điện thoại không được để trống';
    else if (!phoneRegex.test(form.phone)) errors.phone = 'SĐT không hợp lệ (đầu số 03, 05, 07, 08, 09)';

    if (!form.password) errors.password = 'Mật khẩu không được để trống';
    else if (form.password.length < 6) errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    else if (form.password.length > 50) errors.password = 'Mật khẩu không vượt quá 50 ký tự';

    if (form.password !== form.confirmPassword) errors.confirmPassword = 'Mật khẩu xác nhận không khớp';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setOperatorSuccess(false);

    if (!validateForm()) return;

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
            onClick={() => { setRole('CUSTOMER'); setLocalError(null); setFieldErrors({}); setOperatorSuccess(false); dispatch(clearError()); }}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
              role === 'CUSTOMER'
                ? 'bg-[#e85d04] text-white shadow-md'
                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 border border-gray-200 dark:border-white/10'
            }`}
          >
            Hành khách
          </button>
          <button
            onClick={() => { setRole('OPERATOR'); setLocalError(null); setFieldErrors({}); dispatch(clearError()); }}
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
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {role === 'CUSTOMER' && (
                <Input 
                  label="Họ và tên" 
                  placeholder="Nguyễn Văn A"
                  value={form.fullName} 
                  onChange={e => { setForm({ ...form, fullName: e.target.value }); setFieldErrors({ ...fieldErrors, fullName: null }); }} 
                  maxLength={50}
                  error={fieldErrors.fullName}
                  icon="ti-id-badge"
                />
              )}

              {role === 'OPERATOR' && (
                <>
                  <Input 
                    label="Tên nhà xe / Công ty" 
                    placeholder="VD: Nhà xe Hoàng Long"
                    value={form.companyName} 
                    onChange={e => { setForm({ ...form, companyName: e.target.value }); setFieldErrors({ ...fieldErrors, companyName: null }); }} 
                    maxLength={100}
                    error={fieldErrors.companyName}
                    icon="ti-building"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input 
                      label="Hotline đặt vé" 
                      placeholder="1900xxxx"
                      value={form.hotline} 
                      onChange={e => { setForm({ ...form, hotline: e.target.value }); setFieldErrors({ ...fieldErrors, hotline: null }); }} 
                      maxLength={12}
                      error={fieldErrors.hotline}
                      icon="ti-headset"
                    />
                    <Input 
                      label="Mã số kinh doanh" 
                      placeholder="VD: 0101234567"
                      value={form.licenseNumber} 
                      onChange={e => { setForm({ ...form, licenseNumber: e.target.value }); setFieldErrors({ ...fieldErrors, licenseNumber: null }); }} 
                      maxLength={15}
                      error={fieldErrors.licenseNumber}
                      icon="ti-file-certificate"
                    />
                  </div>
                  <Input 
                    label="Địa chỉ văn phòng chính" 
                    placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                    value={form.address} 
                    onChange={e => { setForm({ ...form, address: e.target.value }); setFieldErrors({ ...fieldErrors, address: null }); }} 
                    maxLength={200}
                    error={fieldErrors.address}
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
                  onChange={e => { setForm({ ...form, email: e.target.value }); setFieldErrors({ ...fieldErrors, email: null }); }} 
                  maxLength={100}
                  error={fieldErrors.email}
                  icon="ti-mail"
                />
                <Input 
                  label={role === 'OPERATOR' ? 'SĐT quản lý' : 'Số điện thoại'} 
                  placeholder="0901234567"
                  value={form.phone} 
                  onChange={e => { setForm({ ...form, phone: e.target.value }); setFieldErrors({ ...fieldErrors, phone: null }); }} 
                  maxLength={10}
                  error={fieldErrors.phone}
                  icon="ti-phone"
                />
              </div>

              <Input 
                label="Mật khẩu" 
                type="password" 
                placeholder="Ít nhất 6 ký tự"
                value={form.password} 
                onChange={e => { setForm({ ...form, password: e.target.value }); setFieldErrors({ ...fieldErrors, password: null }); }} 
                maxLength={50}
                error={fieldErrors.password}
                icon="ti-lock"
              />
              <Input 
                label="Xác nhận mật khẩu" 
                type="password" 
                placeholder="Nhập lại mật khẩu"
                value={form.confirmPassword} 
                onChange={e => { setForm({ ...form, confirmPassword: e.target.value }); setFieldErrors({ ...fieldErrors, confirmPassword: null }); }} 
                maxLength={50}
                error={fieldErrors.confirmPassword}
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
