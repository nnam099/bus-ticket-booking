// ProfilePage.jsx
import { useState, useEffect } from 'react';
import { userAPI } from '../../services/api';
export default function ProfilePage() {
  const [form, setForm] = useState({ fullName: '', phone: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    userAPI.getMe().then(r => {
      const u = r.data.data;
      setForm({ fullName: u.customer?.fullName || '', phone: u.phone || '' });
    });
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try { await userAPI.updateMe(form); setMsg('Cập nhật thành công!'); }
    catch { setMsg('Cập nhật thất bại.'); }
    finally { setLoading(false); }
  };

  const handlePw = async (e) => {
    e.preventDefault();
    setLoading(true);
    try { await userAPI.changePassword(pwForm); setMsg('Đổi mật khẩu thành công!'); setPwForm({ currentPassword: '', newPassword: '' }); }
    catch (err) { setMsg(err.response?.data?.message || 'Đổi mật khẩu thất bại.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Hồ sơ cá nhân</h1>
      {msg && <div className="card border-green-200 bg-green-50 text-green-700 text-sm mb-4">{msg}</div>}
      <div className="card mb-6">
        <h2 className="font-semibold text-gray-700 mb-4">Thông tin cá nhân</h2>
        <form onSubmit={handleUpdate} className="space-y-3">
          <div><label className="label">Họ tên</label><input className="input" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} /></div>
          <div><label className="label">Số điện thoại</label><input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          <button type="submit" disabled={loading} className="btn-primary py-2">Lưu thay đổi</button>
        </form>
      </div>
      <div className="card">
        <h2 className="font-semibold text-gray-700 mb-4">Đổi mật khẩu</h2>
        <form onSubmit={handlePw} className="space-y-3">
          <div><label className="label">Mật khẩu hiện tại</label><input className="input" type="password" value={pwForm.currentPassword} onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} /></div>
          <div><label className="label">Mật khẩu mới</label><input className="input" type="password" value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} /></div>
          <button type="submit" disabled={loading} className="btn-primary py-2">Đổi mật khẩu</button>
        </form>
      </div>
    </div>
  );
}
