import { useState, useEffect } from 'react';
import { userAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';

export default function ProfilePage() {
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', companyName: '', hotline: '', licenseNumber: '', address: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [userExt, setUserExt] = useState(null);

  useEffect(() => {
    userAPI.getMe().then(r => {
      const u = r.data.data;
      const name = u.customer?.fullName || u.staff?.fullName || u.admin?.fullName || '';
      setForm({ 
        fullName: name, 
        phone: u.phone || '',
        email: u.email || '',
        companyName: u.busOperator?.companyName || '',
        hotline: u.busOperator?.hotline || '',
        licenseNumber: u.busOperator?.licenseNumber || '',
        address: u.busOperator?.address || u.staff?.address || ''
      });
      setUserExt(u);
    });
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try { 
      await userAPI.updateMe(form); 
      setMsg({ type: 'success', text: 'Cập nhật thành công!' }); 
    }
    catch (err) { 
      setMsg({ type: 'error', text: err.response?.data?.message || 'Cập nhật thất bại.' }); 
    }
    finally { setLoading(false); }
  };

  const handlePw = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try { 
      await userAPI.changePassword(pwForm); 
      setMsg({ type: 'success', text: 'Đổi mật khẩu thành công!' }); 
      setPwForm({ currentPassword: '', newPassword: '' }); 
    }
    catch (err) { 
      setMsg({ type: 'error', text: err.response?.data?.message || 'Đổi mật khẩu thất bại.' }); 
    }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Hồ sơ cá nhân"
        description="Quản lý thông tin cá nhân và bảo mật tài khoản của bạn"
      />
      
      {userExt?.staff?.operator && (
        <Card className="mb-6 bg-orange-50/50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20" noPadding>
          <div className="p-4">
            <p className="font-medium text-sm flex items-center gap-2 text-orange-800 dark:text-orange-200">
              <i className="ti ti-building text-lg" />
              Nơi công tác: <strong className="font-bold">{userExt.staff.operator.companyName}</strong>
            </p>
          </div>
        </Card>
      )}

      {msg && (
        <div className={`mb-6 p-4 rounded-md text-sm font-medium ${
          msg.type === 'success' 
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
            : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
        }`}>
          {msg.text}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-5">Thông tin cá nhân</h2>
          <form onSubmit={handleUpdate} className="space-y-4">
            {userExt?.busOperator ? (
              <>
                <Input 
                  label="Tên nhà xe / Công ty"
                  value={form.companyName} 
                  onChange={e => setForm({ ...form, companyName: e.target.value })} 
                  placeholder="Nhập tên công ty"
                />
                <Input 
                  label="Hotline đặt vé"
                  value={form.hotline} 
                  onChange={e => setForm({ ...form, hotline: e.target.value })} 
                  placeholder="Nhập hotline"
                />
                <Input 
                  label="Mã số kinh doanh"
                  value={form.licenseNumber} 
                  onChange={e => setForm({ ...form, licenseNumber: e.target.value })} 
                  placeholder="Nhập mã số KD"
                />
                <Input 
                  label="Địa chỉ văn phòng"
                  value={form.address} 
                  onChange={e => setForm({ ...form, address: e.target.value })} 
                  placeholder="Nhập địa chỉ"
                />
              </>
            ) : (
              <Input 
                label="Họ tên"
                value={form.fullName} 
                onChange={e => setForm({ ...form, fullName: e.target.value })} 
                placeholder="Nhập họ tên"
              />
            )}
            
            <Input 
              label={userExt?.busOperator ? 'SĐT quản lý' : 'Số điện thoại'}
              value={form.phone} 
              onChange={e => setForm({ ...form, phone: e.target.value })} 
              placeholder="Nhập số điện thoại"
            />
            <Input 
              label="Email"
              type="email"
              value={form.email} 
              onChange={e => setForm({ ...form, email: e.target.value })} 
              placeholder="Nhập địa chỉ email"
            />
            {userExt?.staff && (
              <Input 
                label="Địa chỉ thường trú"
                value={form.address} 
                onChange={e => setForm({ ...form, address: e.target.value })} 
                placeholder="Nhập địa chỉ"
              />
            )}
            <div className="pt-2">
              <Button type="submit" disabled={loading} fullWidth>
                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-5">Đổi mật khẩu</h2>
          <form onSubmit={handlePw} className="space-y-4">
            <Input 
              label="Mật khẩu hiện tại"
              type="password" 
              value={pwForm.currentPassword} 
              onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} 
              placeholder="••••••••"
            />
            <Input 
              label="Mật khẩu mới"
              type="password" 
              value={pwForm.newPassword} 
              onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} 
              placeholder="••••••••"
            />
            <div className="pt-2">
              <Button type="submit" variant="outline" disabled={loading} fullWidth>
                {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
