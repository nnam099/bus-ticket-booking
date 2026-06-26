import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { operatorAPI } from '../../services/api';
import { PageHeader, Card, Select, Input, Loading } from '../../components/ui';

export default function OperatorDashboard() {
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({ period: 'month', dateFrom: '', dateTo: '', routeId: '' });

  useEffect(() => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
    operatorAPI.getDashboard(params).then(r => setStats(r.data.data));
  }, [filters]);

  const cards = stats ? [
    { label: 'Chuyến trong kỳ', value: stats.totalTrips, icon: 'ti-bus' },
    { label: 'Vé đã bán', value: stats.totalTickets, icon: 'ti-ticket' },
    { label: 'Doanh thu', value: `${Number(stats.totalRevenue).toLocaleString('vi-VN')}đ`, icon: 'ti-coin' },
    { label: 'Chuyến hôm nay', value: stats.todayTrips, icon: 'ti-calendar' },
    { label: 'Vé hôm nay', value: stats.todayTickets, icon: 'ti-check' },
    { label: 'Doanh thu hôm nay', value: `${Number(stats.todayRevenue).toLocaleString('vi-VN')}đ`, icon: 'ti-bolt' },
  ] : [];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Tổng quan nhà xe" 
        description="Theo dõi doanh thu, vé bán và lịch chạy trong ngày." 
      />

      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select
            value={filters.period}
            onChange={e => setFilters({ ...filters, period: e.target.value, dateFrom: '', dateTo: '' })}
            options={[
              { value: 'day', label: 'Hôm nay' },
              { value: 'month', label: 'Tháng này' },
              { value: 'year', label: 'Năm nay' }
            ]}
          />
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={e => setFilters({ ...filters, dateFrom: e.target.value })}
          />
          <Input
            type="date"
            value={filters.dateTo}
            min={filters.dateFrom || undefined}
            onChange={e => setFilters({ ...filters, dateTo: e.target.value })}
          />
          <Select
            value={filters.routeId}
            onChange={e => setFilters({ ...filters, routeId: e.target.value })}
            options={[
              { value: '', label: 'Tất cả tuyến' },
              ...(stats?.routes || []).map(route => ({
                value: route.id,
                label: `${route.originCity} → ${route.destinationCity}`
              }))
            ]}
          />
        </div>
      </Card>

      {stats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {cards.map(c => (
              <Card key={c.label} hover>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 dark:bg-[#e85d04]/10 text-[#e85d04]">
                  <i className={`ti ${c.icon} text-2xl`}></i>
                </div>
                <div className="text-3xl font-black text-gray-900 dark:text-white">{c.value}</div>
                <div className="mt-1 text-sm font-semibold text-gray-500 dark:text-gray-400">{c.label}</div>
              </Card>
            ))}
          </div>

          <Card hover className="border-l-4 border-l-[#e85d04] dark:border-l-[#e85d04]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-lg text-gray-900 dark:text-white">Chuyến sắp chạy</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Các chuyến còn ở trạng thái lịch trình, lên xe hoặc trễ giờ.</p>
              </div>
              <span className="text-4xl font-black text-[#e85d04]">{stats.upcomingTrips}</span>
            </div>
          </Card>
        </>
      ) : (
        <Loading />
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { to: '/operator/vehicles', icon: 'ti-car', label: 'Quản lý xe' },
          { to: '/operator/routes', icon: 'ti-map-pin', label: 'Tuyến xe' },
          { to: '/operator/trips', icon: 'ti-calendar-event', label: 'Chuyến xe' },
          { to: '/operator/reports', icon: 'ti-chart-bar', label: 'Báo cáo' },
        ].map(item => (
          <Link key={item.to} to={item.to} className="group outline-none">
            <Card hover className="text-center h-full flex flex-col items-center justify-center !p-6 border-transparent group-hover:border-[#e85d04] transition-colors">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 transition-colors group-hover:bg-[#e85d04] group-hover:text-white">
                <i className={`ti ${item.icon} text-2xl`}></i>
              </div>
              <div className="text-sm font-bold text-gray-800 dark:text-gray-200">{item.label}</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
