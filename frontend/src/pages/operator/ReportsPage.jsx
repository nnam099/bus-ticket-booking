import { useEffect, useState } from 'react';
import { operatorAPI } from '../../services/api';
import { PageHeader, Card, Select, Loading, EmptyState } from '../../components/ui';

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
    operatorAPI.getDashboard({ period })
      .then(r => setStats(r.data.data))
      .catch(() => setError('Không thể tải báo cáo doanh thu.'))
      .finally(() => setLoading(false));
  }, [period]);

  const cards = stats ? [
    { label: 'Số chuyến', value: stats.totalTrips, icon: 'ti-bus' },
    { label: 'Vé bán ra', value: stats.totalTickets, icon: 'ti-ticket' },
    { label: 'Doanh thu', value: `${Number(stats.totalRevenue).toLocaleString('vi-VN')}đ`, icon: 'ti-coin' },
  ] : [];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Báo cáo doanh thu" 
        description={`Theo dõi hiệu quả bán vé trong ${periodLabels[period].toLowerCase()}.`}
        actions={
          <div className="w-full md:w-48">
            <Select 
              value={period} 
              onChange={e => setPeriod(e.target.value)}
              options={[
                { value: 'day', label: 'Hôm nay' },
                { value: 'month', label: 'Tháng này' },
                { value: 'year', label: 'Năm nay' }
              ]}
            />
          </div>
        }
      />

      {error && <Card className="border-red-200 bg-red-50 text-red-700">{error}</Card>}

      {loading ? (
        <Loading />
      ) : !stats ? (
        <EmptyState title="Chưa có dữ liệu báo cáo" description="Dữ liệu sẽ được cập nhật khi có vé phát sinh." icon="ti-chart-bar" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      )}
    </div>
  );
}
