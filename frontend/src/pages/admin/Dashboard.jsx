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
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
    { label: 'Người dùng', value: stats.totalUsers, icon: 'users', trend: '+12%' },
    { label: 'Nhà xe', value: stats.totalOperators, icon: 'operator', trend: '+2' },
    { label: 'Chuyến trong kỳ', value: stats.totalTrips, icon: 'bus', trend: '+5%' },
    { label: 'Vé đã bán', value: stats.totalTickets, icon: 'ticket', trend: '+18%' },
    { label: 'Chuyến hôm nay', value: stats.todayTrips, icon: 'calendar', trend: '0%' },
    { label: 'Vé hôm nay', value: stats.todayTickets, icon: 'check', trend: '+3%' },
  ] : [];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard" 
        description="Tổng quan hệ thống BusGo Việt Nam" 
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
              <Card key={c.label}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[13px] font-medium text-gray-500 dark:text-gray-400">{c.label}</span>
                  <div className="text-gray-400 dark:text-gray-500">
                    <AdminIcon name={c.icon} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">{c.value}</div>
                  {c.trend && (
                    <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      {c.trend}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Nhà xe chờ duyệt</p>
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">Cần xử lý để vận hành.</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
                  <i className="ti ti-alert-circle text-lg"></i>
                </div>
              </div>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.pendingOperators}</div>
            </Card>
            <Card className="flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tuyến đang mở</p>
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">Tổng số tuyến hoạt động.</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <i className="ti ti-check text-lg"></i>
                </div>
              </div>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.activeRoutes}</div>
            </Card>
          </div>
        </>
      ) : (
        <Loading />
      )}
    </div>
  );
}
