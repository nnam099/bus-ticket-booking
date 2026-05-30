import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    adminAPI.getStats({}).then(r => setStats(r.data.data));
  }, []);

  const cards = stats ? [
    { label: 'Tổng người dùng', value: stats.totalUsers, icon: '👥', sub: 'Tài khoản đang hoạt động' },
    { label: 'Nhà xe đã duyệt', value: stats.totalOperators, icon: '🏢', sub: 'Đang vận hành trong hệ thống' },
    { label: 'Nhà xe chờ duyệt', value: stats.pendingOperators, icon: '⏳', sub: 'Cần xử lý để nhà xe vận hành', highlight: stats.pendingOperators > 0 },
  ] : [];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Tổng quan hệ thống</h1>
        <p className="text-sm text-gray-500 mt-1">Quản lý tài khoản người dùng, tài xế và nhà xe.</p>
      </div>

      {/* Stat cards */}
      {stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {cards.map(c => (
            <div
              key={c.label}
              className={`card flex items-center gap-4 ${c.highlight ? 'border-yellow-300 bg-yellow-50' : ''}`}
            >
              <div className="text-4xl">{c.icon}</div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{c.value}</div>
                <div className="font-medium text-gray-700 text-sm">{c.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{c.sub}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="card animate-pulse flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-gray-100" />
              <div className="flex-1">
                <div className="h-6 w-16 rounded bg-gray-100" />
                <div className="mt-2 h-4 w-28 rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { to: '/admin/operators', icon: '🏢', label: 'Quản lý nhà xe' },
          { to: '/admin/users',     icon: '👥', label: 'Người dùng' },
          { to: '/admin/reviews',   icon: '⭐', label: 'Đánh giá' },
          { to: '/admin/audit',     icon: '🔍', label: 'Audit Log' },
        ].map(item => (
          <Link
            key={item.to}
            to={item.to}
            className="card text-center hover:shadow-md transition-shadow"
          >
            <div className="text-3xl mb-1">{item.icon}</div>
            <div className="text-sm font-medium text-gray-700">{item.label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
