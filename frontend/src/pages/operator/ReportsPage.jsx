// ReportsPage.jsx
import { useEffect, useState } from 'react';
import { operatorAPI } from '../../services/api';

export default function ReportsPage() {
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState('month');
  useEffect(() => { operatorAPI.getDashboard(period).then(r => setStats(r.data.data)); }, [period]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Báo cáo doanh thu</h1>
        <select className="input w-auto" value={period} onChange={e => setPeriod(e.target.value)}>
          <option value="day">Hôm nay</option>
          <option value="month">Tháng này</option>
          <option value="year">Năm nay</option>
        </select>
      </div>
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Số chuyến', value: stats.totalTrips, icon: '🚌' },
            { label: 'Vé bán ra', value: stats.totalTickets, icon: '🎫' },
            { label: 'Doanh thu', value: `${Number(stats.totalRevenue).toLocaleString('vi-VN')}đ`, icon: '💰' },
          ].map(c => (
            <div key={c.label} className="card">
              <div className="text-3xl mb-2">{c.icon}</div>
              <div className="text-2xl font-bold text-gray-800">{c.value}</div>
              <div className="text-sm text-gray-500 mt-1">{c.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
