import { useEffect, useState } from 'react';
import { operatorAPI } from '../../services/api';

const periodLabels = {
  day: 'Hôm nay',
  month: 'Tháng này',
  year: 'Năm nay',
};

export default function ReportsPage() {
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    operatorAPI.getDashboard(period)
      .then(r => setStats(r.data.data))
      .catch(() => setError('Không thể tải báo cáo doanh thu.'))
      .finally(() => setLoading(false));
  }, [period]);

  const cards = stats ? [
    { label: 'Số chuyến', value: stats.totalTrips },
    { label: 'Vé bán ra', value: stats.totalTickets },
    { label: 'Doanh thu', value: `${Number(stats.totalRevenue).toLocaleString('vi-VN')}đ` },
  ] : [];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Báo cáo doanh thu</h1>
          <p className="mt-1 text-sm text-gray-500">Theo dõi hiệu quả bán vé trong {periodLabels[period].toLowerCase()}.</p>
        </div>
        <select className="input w-full md:w-auto" value={period} onChange={e => setPeriod(e.target.value)}>
          <option value="day">Hôm nay</option>
          <option value="month">Tháng này</option>
          <option value="year">Năm nay</option>
        </select>
      </div>

      {error && <div className="card mb-4 border-red-200 bg-red-50 text-sm font-medium text-red-700">{error}</div>}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map(item => (
            <div key={item} className="card animate-pulse">
              <div className="h-8 w-24 rounded bg-gray-100" />
              <div className="mt-4 h-4 w-32 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : !stats ? (
        <div className="card text-center py-14">
          <p className="font-semibold text-gray-800">Chưa có dữ liệu báo cáo</p>
          <p className="mt-1 text-sm text-gray-500">Dữ liệu sẽ được cập nhật khi có vé phát sinh.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {cards.map(c => (
            <div key={c.label} className="card">
              <div className="text-2xl font-bold text-gray-800">{c.value}</div>
              <div className="mt-1 text-sm text-gray-500">{c.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
