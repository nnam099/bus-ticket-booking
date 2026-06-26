import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI, operatorAPI, routeAPI } from '../../services/api';
import { PageHeader, Card, Select, Input, Loading } from '../../components/ui';

const iconPaths = {
  users: 'M17 20h5v-2a4 4 0 0 0-5.4-3.75M9 20H4v-2a4 4 0 0 1 5.4-3.75M15 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm6 3a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  operator: 'M4 21V7a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v14M9 21v-4h2v4M7 9h1M7 13h1M11 9h1M11 13h1M15 21h5v-8a2 2 0 0 0-2-2h-3',
  bus: 'M5 16V7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v9M5 16h14M7 19h.01M17 19h.01M8 4v12M16 4v12',
  ticket: 'M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 1 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 1 0 0-4V7Zm8-1v12',
  calendar: 'M7 3v4M17 3v4M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z',
  check: 'm5 13 4 4L19 7',
  route: 'M6 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm12-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8.5 14.5 15.5 9.5',
  review: 'm12 3 2.7 5.47 6.04.88-4.37 4.26 1.03 6.02L12 16.78 6.6 19.63l1.03-6.02-4.37-4.26 6.04-.88L12 3Z',
  audit: 'M11 5H6a2 2 0 0 0-2 2v11h14v-5M15 4h5v5M20 4l-9 9',
};

function AdminIcon({ name }) {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={iconPaths[name]} />
    </svg>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [operators, setOperators] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [filters, setFilters] = useState({
    period: 'month',
    dateFrom: '',
    dateTo: '',
    operatorId: '',
    routeId: '',
  });

  useEffect(() => {
    Promise.all([
      operatorAPI.getAll(),
      routeAPI.getAll(),
    ]).then(([operatorRes, routeRes]) => {
      setOperators(operatorRes.data.data || []);
      setRoutes(routeRes.data.data || []);
    });
  }, []);

  useEffect(() => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
    adminAPI.getStats(params).then(r => setStats(r.data.data));
  }, [filters]);

  const filteredRoutes = filters.operatorId
    ? routes.filter(route => route.operatorId === filters.operatorId || route.operator?.id === filters.operatorId)
    : routes;

  const cards = stats ? [
    { label: 'Người dùng', value: stats.totalUsers, icon: 'users' },
    { label: 'Nhà xe', value: stats.totalOperators, icon: 'operator' },
    { label: 'Chuyến trong kỳ', value: stats.totalTrips, icon: 'bus' },
    { label: 'Vé đã bán', value: stats.totalTickets, icon: 'ticket' },
    { label: 'Chuyến hôm nay', value: stats.todayTrips, icon: 'calendar' },
    { label: 'Vé hôm nay', value: stats.todayTickets, icon: 'check' },
  ] : [];

  const quickLinks = [
    { to: '/admin/operators', icon: 'operator', label: 'Quản lý nhà xe' },
    { to: '/admin/users', icon: 'users', label: 'Người dùng' },
    { to: '/admin/reviews', icon: 'review', label: 'Đánh giá' },
    { to: '/admin/audit', icon: 'audit', label: 'Nhật ký kiểm toán' },
  ];

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Tổng quan hệ thống" 
        description="Lọc vé và chuyến theo ngày, tuyến hoặc nhà xe." 
      />

      <Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
            min={filters.dateFrom || undefined}
            value={filters.dateTo}
            onChange={e => setFilters({ ...filters, dateTo: e.target.value })}
          />
          <Select
            value={filters.operatorId}
            onChange={e => setFilters({ ...filters, operatorId: e.target.value, routeId: '' })}
            options={[
              { value: '', label: 'Tất cả nhà xe' },
              ...operators.map(op => ({ value: op.id, label: op.companyName }))
            ]}
          />
          <Select
            value={filters.routeId}
            onChange={e => setFilters({ ...filters, routeId: e.target.value })}
            options={[
              { value: '', label: 'Tất cả tuyến' },
              ...filteredRoutes.map(route => ({ value: route.id, label: `${route.originCity} -> ${route.destinationCity}` }))
            ]}
          />
        </div>
      </Card>

      {stats ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map(c => (
              <Card key={c.label} hover>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 dark:bg-[#e85d04]/10 text-[#e85d04]">
                  <AdminIcon name={c.icon} />
                </div>
                <div className="text-3xl font-black text-gray-900 dark:text-white">{c.value}</div>
                <div className="mt-1 text-sm font-semibold text-gray-500 dark:text-gray-400">{c.label}</div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card hover className="border-l-4 border-l-red-500 dark:border-l-red-500">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-lg text-gray-900 dark:text-white">Nhà xe chờ duyệt</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Cần xử lý để nhà xe có thể vận hành.</p>
                </div>
                <span className="text-4xl font-black text-red-500">{stats.pendingOperators}</span>
              </div>
            </Card>
            <Card hover className="border-l-4 border-l-green-500 dark:border-l-green-500">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-lg text-gray-900 dark:text-white">Tuyến đang mở</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Tổng số tuyến đang hoạt động.</p>
                </div>
                <span className="text-4xl font-black text-green-500">{stats.activeRoutes}</span>
              </div>
            </Card>
          </div>
        </>
      ) : (
        <Loading />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickLinks.map(item => (
          <Link
            key={item.to}
            to={item.to}
            className="group outline-none"
          >
            <Card hover className="text-center h-full flex flex-col items-center justify-center !p-6 border-transparent group-hover:border-[#e85d04] transition-colors">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 transition-colors group-hover:bg-[#e85d04] group-hover:text-white">
                <AdminIcon name={item.icon} />
              </div>
              <div className="text-sm font-bold text-gray-800 dark:text-gray-200">{item.label}</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
