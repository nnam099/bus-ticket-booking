import { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Input, Modal, Badge, Loading } from '../../components/ui';
import { operatorAPI } from '../../services/api';

export default function StaffManagementPage() {
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', role: 'DRIVER', licenseNo: '', address: '', password: ''
  });
  const [newPassword, setNewPassword] = useState('');

  const fetchStaffs = async () => {
    try {
      const res = await operatorAPI.getStaffs();
      setStaffs(res.data.data);
    } catch (err) {
      alert('Không thể tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffs();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await operatorAPI.createStaff(formData);
      alert('Thêm nhân viên thành công!');
      setShowAddModal(false);
      setFormData({ fullName: '', email: '', phone: '', role: 'DRIVER', licenseNo: '', address: '', password: '' });
      fetchStaffs();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleToggleActive = async (staff) => {
    if (!window.confirm(`Bạn có chắc muốn ${staff.user.isActive ? 'khóa' : 'mở khóa'} tài khoản này?`)) return;
    try {
      const res = await operatorAPI.toggleStaffActive(staff.id);
      alert(res.data.message);
      fetchStaffs();
    } catch (err) {
      alert('Có lỗi xảy ra');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const res = await operatorAPI.resetStaffPassword(selectedStaff.id, newPassword);
      alert(res.data.message);
      setShowResetModal(false);
      setNewPassword('');
      setSelectedStaff(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý nhân viên"
        description="Thêm, sửa, khóa tài khoản hoặc cấp lại mật khẩu cho nhân viên của bạn."
        action={
          <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
            <i className="ti ti-plus" /> Thêm nhân viên
          </Button>
        }
      />

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Tên nhân viên</th>
                <th className="px-6 py-4 font-semibold">Liên hệ</th>
                <th className="px-6 py-4 font-semibold">Vai trò</th>
                <th className="px-6 py-4 font-semibold">Trạng thái</th>
                <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-white/10">
              {staffs.map(staff => (
                <tr key={staff.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {staff.fullName}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1"><i className="ti ti-mail" /> {staff.user.email}</span>
                      <span className="flex items-center gap-1"><i className="ti ti-phone" /> {staff.user.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={staff.role === 'DRIVER' ? 'primary' : 'warning'}>
                      {staff.role === 'DRIVER' ? 'Tài xế' : 'Phụ xe'}
                    </Badge>
                    {staff.licenseNo && <div className="mt-1 text-xs text-gray-500">Bằng: {staff.licenseNo}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={staff.user.isActive ? 'success' : 'danger'}>
                      {staff.user.isActive ? 'Hoạt động' : 'Đã khóa'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedStaff(staff);
                          setShowResetModal(true);
                        }}
                        title="Cấp lại mật khẩu"
                      >
                        <i className="ti ti-key" />
                      </Button>
                      <Button
                        variant={staff.user.isActive ? 'danger' : 'success'}
                        size="sm"
                        onClick={() => handleToggleActive(staff)}
                        title={staff.user.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                      >
                        <i className={`ti ${staff.user.isActive ? 'ti-lock' : 'ti-lock-open'}`} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {staffs.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    Chưa có nhân viên nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Thêm nhân viên mới">
        <form onSubmit={handleAdd} className="space-y-4">
          <Input label="Họ tên" required value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            <Input label="Số điện thoại" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Vai trò</label>
              <select
                className="w-full h-[42px] px-3 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#111] dark:text-white outline-none focus:border-[#e85d04] focus:ring-1 focus:ring-[#e85d04]"
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="DRIVER">Tài xế</option>
                <option value="ASSISTANT">Phụ xe</option>
              </select>
            </div>
            <Input label="Bằng lái (Tùy chọn)" value={formData.licenseNo} onChange={e => setFormData({ ...formData, licenseNo: e.target.value })} />
          </div>
          <Input label="Mật khẩu đăng nhập" type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>Hủy</Button>
            <Button type="submit">Thêm nhân viên</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showResetModal} onClose={() => setShowResetModal(false)} title="Cấp lại mật khẩu">
        <form onSubmit={handleResetPassword} className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Bạn đang cấp lại mật khẩu cho nhân viên <strong className="text-gray-900 dark:text-white">{selectedStaff?.fullName}</strong>.
          </p>
          <Input 
            label="Mật khẩu mới" 
            type="password" 
            required 
            minLength={6}
            value={newPassword} 
            onChange={e => setNewPassword(e.target.value)} 
          />
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowResetModal(false)}>Hủy</Button>
            <Button type="submit" variant="primary">Lưu mật khẩu mới</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
