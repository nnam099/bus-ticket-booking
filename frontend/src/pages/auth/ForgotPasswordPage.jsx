import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../services/api';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState('');
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
      await authAPI.verifyOtp({ userId, code: otp, purpose: 'RESET_PASSWORD' });
      setStep(3);
    } catch { setError('Mã OTP không đúng hoặc đã hết hạn.'); }
    finally { setLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) { setError('Mật khẩu phải có ít nhất 6 ký tự.'); return; }
    setLoading(true); setError(null);
    try {
      await authAPI.resetPassword({ userId, code: otp, newPassword });
      setStep(4);
    } catch { setError('Đặt lại mật khẩu thất bại.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Quên mật khẩu</h1>
        </div>
        <div className="card space-y-4">
          {step === 1 && (
            <form onSubmit={handleSend}>
              <label className="label">Email hoặc số điện thoại</label>
              <input className="input mb-3" placeholder="email@example.com"
                value={identifier} onChange={e => setIdentifier(e.target.value)} required />
              {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
              </button>
            </form>
          )}
          {step === 2 && (
            <form onSubmit={handleVerify}>
              {message && <p className="text-sm text-green-700 bg-green-50 p-2 rounded mb-2">{message}</p>}
              <label className="label">Mã OTP (6 chữ số)</label>
              <input className="input mb-3" placeholder="123456" maxLength={6}
                value={otp} onChange={e => setOtp(e.target.value)} required />
              {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? 'Đang xác thực...' : 'Xác nhận OTP'}
              </button>
            </form>
          )}
          {step === 3 && (
            <form onSubmit={handleReset}>
              <label className="label">Mật khẩu mới</label>
              <input className="input mb-3" type="password" placeholder="Ít nhất 6 ký tự"
                value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
              {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
              </button>
            </form>
          )}
          {step === 4 && (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">✅</div>
              <p className="font-semibold text-gray-800 mb-1">Đặt lại mật khẩu thành công!</p>
              <Link to="/login" className="btn-primary inline-block mt-3 px-6 py-2">
                Đăng nhập ngay
              </Link>
            </div>
          )}
          {step < 4 && (
            <p className="text-center text-sm text-gray-500">
              <Link to="/login" className="text-brand hover:underline">← Quay lại đăng nhập</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
