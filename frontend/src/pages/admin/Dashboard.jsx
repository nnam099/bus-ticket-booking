import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI, operatorAPI, routeAPI } from '../../services/api';

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
      setOperators(operatorRes.data.data);
      setRoutes(routeRes.data.data);
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
    { label: 'Nguoi dung', value: stats.totalUsers, icon: '👥' },
    { label: 'Nha xe', value: stats.totalOperators, icon: '🏢' },
    { label: 'Chuyen trong ky', value: stats.totalTrips, icon: '🚌' },
    { label: 'Ve da ban', value: stats.totalTickets, icon: '🎫' },
    { label: 'Chuyen hom nay', value: stats.todayTrips, icon: '📅' },
    { label: 'Ve hom nay', value: stats.todayTickets, icon: '✅' },
  ] : [];

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tong quan he thong</h1>
          <p className="text-sm text-gray-500 mt-1">Loc ve va chuyen theo ngay, tuyen hoac nha xe.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <select
            className="input"
            value={filters.period}
            onChange={e => setFilters({ ...filters, period: e.target.value, dateFrom: '', dateTo: '' })}
          >
            <option value="day">Hom nay</option>
            <option value="month">Thang nay</option>
            <option value="year">Nam nay</option>
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
            min={filters.dateFrom || undefined}
            value={filters.dateTo}
            onChange={e => setFilters({ ...filters, dateTo: e.target.value })}
          />
          <select
            className="input"
            value={filters.operatorId}
            onChange={e => setFilters({ ...filters, operatorId: e.target.value, routeId: '' })}
          >
            <option value="">Tat ca nha xe</option>
            {operators.map(operator => (
              <option key={operator.id} value={operator.id}>{operator.companyName}</option>
            ))}
          </select>
          <select
            className="input"
            value={filters.routeId}
            onChange={e => setFilters({ ...filters, routeId: e.target.value })}
          >
            <option value="">Tat ca tuyen</option>
            {filteredRoutes.map(route => (
              <option key={route.id} value={route.id}>
                {route.originCity} → {route.destinationCity}
              </option>
            ))}
          </select>
        </div>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {cards.map(c => (
              <div key={c.label} className="card">
                <div className="text-3xl mb-2">{c.icon}</div>
                <div className="text-xl font-bold text-gray-800">{c.value}</div>
                <div className="text-sm text-gray-500">{c.label}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="card flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">Nha xe cho duyet</p>
                <p className="text-sm text-gray-500">Can xu ly de nha xe co the van hanh.</p>
              </div>
              <span className="text-3xl font-black text-brand">{stats.pendingOperators}</span>
            </div>
            <div className="card flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">Tuyen dang mo</p>
                <p className="text-sm text-gray-500">Tong so tuyen active trong he thong.</p>
              </div>
              <span className="text-3xl font-black text-brand">{stats.activeRoutes}</span>
            </div>
          </div>
        </>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { to: '/admin/operators', icon: '🏢', label: 'Quan ly nha xe' },
          { to: '/admin/users', icon: '👥', label: 'Nguoi dung' },
          { to: '/admin/reviews', icon: '⭐', label: 'Danh gia' },
          { to: '/admin/audit', icon: '🔍', label: 'Audit Log' },
        ].map(item => (
          <Link key={item.to} to={item.to} className="card text-center hover:shadow-md transition-shadow">
            <div className="text-3xl mb-1">{item.icon}</div>
            <div className="text-sm font-medium text-gray-700">{item.label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
