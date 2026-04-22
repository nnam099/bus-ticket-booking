import { useEffect, useState } from 'react';
import { operatorAPI } from '../../services/api';

export default function OperatorDashboard() {
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    operatorAPI.getDashboard(period).then(r => setStats(r.data.data));
  }, [period]);

  const cards = stats ? [
    { label: 'Chuyến xe', value: stats.totalTrips, icon: '🚌' },
    { label: 'Vé đã bán', value: stats.totalTickets, icon: '🎫' },
    { label: 'Doanh thu', value: `${Number(stats.totalRevenue).toLocaleString('vi-VN')}đ`, icon: '💰' },
  ] : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Nhà Xe</h1>
        <select className="input w-auto" value={period} onChange={e => setPeriod(e.target.value)}>
          <option value="day">Hôm nay</option>
          <option value="month">Tháng này</option>
          <option value="year">Năm nay</option>
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {cards.map(c => (
          <div key={c.label} className="card">
            <div className="text-3xl mb-2">{c.icon}</div>
            <div className="text-2xl font-bold text-gray-800">{c.value}</div>
            <div className="text-sm text-gray-500 mt-1">{c.label}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { to: '/operator/vehicles', icon: '🚌', label: 'Quản lý xe' },
          { to: '/operator/routes', icon: '🗺️', label: 'Tuyến xe' },
          { to: '/operator/trips', icon: '📅', label: 'Chuyến xe' },
          { to: '/operator/reports', icon: '📈', label: 'Báo cáo' },
        ].map(item => (
          <a key={item.to} href={item.to}
            className="card text-center hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-3xl mb-1">{item.icon}</div>
            <div className="text-sm font-medium text-gray-700">{item.label}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
