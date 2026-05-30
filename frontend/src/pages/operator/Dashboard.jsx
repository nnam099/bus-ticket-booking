import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { operatorAPI } from '../../services/api';

export default function OperatorDashboard() {
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({ period: 'month', dateFrom: '', dateTo: '', routeId: '' });

  useEffect(() => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
    operatorAPI.getDashboard(params).then(r => setStats(r.data.data));
  }, [filters]);

  const cards = stats ? [
    { label: 'Chuyến trong kỳ', value: stats.totalTrips, icon: '🚌' },
    { label: 'Vé đã bán', value: stats.totalTickets, icon: '🎫' },
    { label: 'Doanh thu', value: `${Number(stats.totalRevenue).toLocaleString('vi-VN')}đ`, icon: '💰' },
    { label: 'Chuyến hôm nay', value: stats.todayTrips, icon: '📅' },
    { label: 'Vé hôm nay', value: stats.todayTickets, icon: '✅' },
    { label: 'Doanh thu hôm nay', value: `${Number(stats.todayRevenue).toLocaleString('vi-VN')}đ`, icon: '⚡' },
  ] : [];

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tổng quan nhà xe</h1>
          <p className="text-sm text-gray-500 mt-1">Theo dõi doanh thu, vé bán và lịch chạy trong ngày.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <select
            className="input"
            value={filters.period}
            onChange={e => setFilters({ ...filters, period: e.target.value, dateFrom: '', dateTo: '' })}
          >
            <option value="day">Hôm nay</option>
            <option value="month">Tháng này</option>
            <option value="year">Năm nay</option>
          </select>
          <input
            type="date"
            className="input"
            value={filters.dateFrom}
            onChange={e => setFilters({ ...filters, dateFrom: e.target.value })}
          />
          <input
            type="date"
            className="input"
            value={filters.dateTo}
            min={filters.dateFrom || undefined}
            onChange={e => setFilters({ ...filters, dateTo: e.target.value })}
          />
          <select
            className="input"
            value={filters.routeId}
            onChange={e => setFilters({ ...filters, routeId: e.target.value })}
          >
            <option value="">Tất cả tuyến</option>
            {(stats?.routes || []).map(route => (
              <option key={route.id} value={route.id}>
                {route.originCity} → {route.destinationCity}
              </option>
            ))}
          </select>
        </div>
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

      {stats && (
        <div className="card mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-800">Chuyến sắp chạy</p>
            <p className="text-sm text-gray-500">Các chuyến còn ở trạng thái lịch trình, lên xe hoặc trễ giờ.</p>
          </div>
          <div className="text-3xl font-black text-brand">{stats.upcomingTrips}</div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { to: '/operator/vehicles', icon: '🚌', label: 'Quản lý xe' },
          { to: '/operator/routes', icon: '🗺️', label: 'Tuyến xe' },
          { to: '/operator/trips', icon: '📅', label: 'Chuyến xe' },
          { to: '/operator/reports', icon: '📈', label: 'Báo cáo' },
        ].map(item => (
          <Link key={item.to} to={item.to}
            className="card text-center hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-3xl mb-1">{item.icon}</div>
            <div className="text-sm font-medium text-gray-700">{item.label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
