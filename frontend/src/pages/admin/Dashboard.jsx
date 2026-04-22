// admin/Dashboard.jsx
import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  useEffect(() => { adminAPI.getStats().then(r => setStats(r.data.data)); }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tổng quan hệ thống</h1>
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Người dùng', value: stats.totalUsers, icon: '👥' },
            { label: 'Nhà xe', value: stats.totalOperators, icon: '🏢' },
            { label: 'Chuyến xe', value: stats.totalTrips, icon: '🚌' },
            { label: 'Doanh thu', value: `${Number(stats.totalRevenue).toLocaleString('vi-VN')}đ`, icon: '💰' },
          ].map(c => (
            <div key={c.label} className="card">
              <div className="text-3xl mb-2">{c.icon}</div>
              <div className="text-xl font-bold text-gray-800">{c.value}</div>
              <div className="text-sm text-gray-500">{c.label}</div>
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { to: '/admin/operators', icon: '🏢', label: 'Quản lý nhà xe' },
          { to: '/admin/users', icon: '👥', label: 'Người dùng' },
          { to: '/admin/reviews', icon: '⭐', label: 'Đánh giá' },
          { to: '/admin/audit', icon: '🔍', label: 'Audit Log' },
        ].map(item => (
          <a key={item.to} href={item.to} className="card text-center hover:shadow-md transition-shadow">
            <div className="text-3xl mb-1">{item.icon}</div>
            <div className="text-sm font-medium text-gray-700">{item.label}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
