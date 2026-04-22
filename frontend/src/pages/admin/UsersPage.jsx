// AdminUsersPage.jsx
import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/users').then(r => setUsers(r.data.data)).catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (id) => {
    try {
      const res = await api.patch(`/admin/users/${id}/toggle-active`);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: res.data.data.isActive } : u));
    } catch { alert('Thao tác thất bại.'); }
  };

  if (loading) return <div className="text-center py-16 text-gray-500">Đang tải...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Quản lý người dùng</h1>
      <div className="space-y-3">
        {users.map(u => (
          <div key={u.id} className="card flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800">{u.email || u.phone}</p>
              <p className="text-sm text-gray-500">
                {u.userRoles?.map(ur => ur.role?.name).join(', ')} •{' '}
                Tạo: {new Date(u.createdAt).toLocaleDateString('vi-VN')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`badge ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {u.isActive ? 'Hoạt động' : 'Bị khóa'}
              </span>
              <button onClick={() => handleToggle(u.id)}
                className={`text-sm px-3 py-1 rounded-lg border transition
                  ${u.isActive ? 'border-red-300 text-red-600 hover:bg-red-50' : 'border-green-300 text-green-600 hover:bg-green-50'}`}>
                {u.isActive ? 'Khóa' : 'Mở khóa'}
              </button>
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <div className="card text-center py-12 text-gray-500">
            <p>Không có người dùng nào.</p>
          </div>
        )}
      </div>
    </div>
  );
}
