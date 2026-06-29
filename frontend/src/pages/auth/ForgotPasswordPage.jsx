import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { Card, Input, Button } from '../../components/ui';
import { KeyRound, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      await authAPI.forgotPassword({ identifier });
      setMessage('Nếu tài khoản tồn tại, OTP đã được gửi đến email/SĐT của bạn.');
      setStep(2);
    } catch { setError('Gửi OTP thất bại.'); }
    finally { setLoading(false); }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      await authAPI.verifyOtp({ identifier, code: otp, purpose: 'RESET_PASSWORD' });
      setStep(3);
    } catch { setError('Mã OTP không đúng hoặc đã hết hạn.'); }
    finally { setLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) { setError('Mật khẩu phải có ít nhất 6 ký tự.'); return; }
    setLoading(true); setError(null);
    try {
      await authAPI.resetPassword({ identifier, code: otp, newPassword });
      setStep(4);
    } catch { setError('Đặt lại mật khẩu thất bại.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md page-enter">
        <div className="text-center mb-8">
          <div className="mb-4 inline-flex bg-orange-100 dark:bg-orange-900/30 p-4 rounded-full shadow-inner text-orange-600 dark:text-orange-400">
            <KeyRound className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Quên mật khẩu</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Lấy lại quyền truy cập tài khoản</p>
        </div>

        <Card className="border-[#e85d04]/20 shadow-lg shadow-orange-900/5">
          {step === 1 && (
            <form onSubmit={handleSend} className="space-y-4">
              <Input 
                label="Email hoặc số điện thoại" 
                placeholder="email@example.com"
                value={identifier} 
                onChange={e => setIdentifier(e.target.value)} 
                required 
                icon="ti-user"
              />
              {error && (
                <div className="text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl px-4 py-3 flex items-center gap-2">
                  <i className="ti ti-alert-circle" /> {error}
                </div>
              )}
              <Button type="submit" disabled={loading} fullWidth size="lg">
                {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerify} className="space-y-4">
              {message && (
                <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl px-4 py-3 flex items-center gap-2">
                  <i className="ti ti-check" /> {message}
                </div>
              )}
              <Input 
                label="Mã OTP (6 chữ số)" 
                placeholder="123456" 
                maxLength={6}
                value={otp} 
                onChange={e => setOtp(e.target.value)} 
                required 
                icon="ti-key"
                className="tracking-widest font-mono text-center text-xl"
              />
              {error && (
                <div className="text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl px-4 py-3 flex items-center gap-2">
                  <i className="ti ti-alert-circle" /> {error}
                </div>
              )}
              <Button type="submit" disabled={loading} fullWidth size="lg">
                {loading ? 'Đang xác thực...' : 'Xác nhận OTP'}
              </Button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleReset} className="space-y-4">
              <Input 
                label="Mật khẩu mới" 
                type="password" 
                placeholder="Ít nhất 6 ký tự"
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                required 
                icon="ti-lock"
              />
              {error && (
                <div className="text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl px-4 py-3 flex items-center gap-2">
                  <i className="ti ti-alert-circle" /> {error}
                </div>
              )}
              <Button type="submit" disabled={loading} fullWidth size="lg">
                {loading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
              </Button>
            </form>
          )}

          {step === 4 && (
            <div className="text-center py-4 page-enter">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Thành công!</h3>
              <p className="font-medium text-gray-600 dark:text-gray-400 mb-6">Mật khẩu của bạn đã được đặt lại thành công.</p>
              <Link to="/login">
                <Button fullWidth size="lg">
                  Đăng nhập ngay
                </Button>
              </Link>
            </div>
          )}

          {step < 4 && (
            <div className="text-center mt-6 pt-6 border-t border-gray-100 dark:border-slate-800">
              <Link to="/login" className="text-sm font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors flex items-center justify-center gap-2">
                <i className="ti ti-arrow-left" /> Quay lại đăng nhập
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
