import { useEffect, useState } from 'react';
import { routeAPI } from '../../services/api';
import { PageHeader, Card, Input, Button, Badge, EmptyState, Loading } from '../../components/ui';

export default function RoutesPage() {
  const [routes, setRoutes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ originCity: '', destinationCity: '', originAddress: '', destinationAddress: '', durationMinutes: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRoutes = () => {
    setError('');
    return routeAPI.getMine()
      .then(r => setRoutes(r.data.data))
      .catch(() => setError('Không thể tải danh sách tuyến xe.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadRoutes(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await routeAPI.create(form);
      setShowForm(false);
      setForm({ originCity: '', destinationCity: '', originAddress: '', destinationAddress: '', durationMinutes: '' });
      loadRoutes();
    } catch (err) {
      alert(err.response?.data?.message || 'Tạo tuyến thất bại.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Quản lý tuyến xe" 
        description="Tuyến xe là nền tảng để tạo chuyến và mở bán vé."
        actions={
          <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'outline' : 'primary'} icon={<i className={`ti ${showForm ? 'ti-x' : 'ti-plus'}`} />}>
            {showForm ? 'Đóng' : 'Thêm tuyến'}
          </Button>
        }
      />

      {error && <Card className="border-red-200 bg-red-50 text-red-700">{error}</Card>}

      {showForm && (
        <Card className="border-[#e85d04]/20 bg-orange-50/50 dark:bg-[#e85d04]/10 page-enter">
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Điểm đi" value={form.originCity} onChange={e => setForm({ ...form, originCity: e.target.value })} required />
            <Input label="Điểm đến" value={form.destinationCity} onChange={e => setForm({ ...form, destinationCity: e.target.value })} required />
            <Input label="Địa chỉ đón" value={form.originAddress} onChange={e => setForm({ ...form, originAddress: e.target.value })} />
            <Input label="Địa chỉ trả" value={form.destinationAddress} onChange={e => setForm({ ...form, destinationAddress: e.target.value })} />
            
            <div className="flex gap-3 md:col-span-2 pt-2 border-t border-gray-200 dark:border-slate-700">
              <Button type="submit">Tạo tuyến</Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Hủy</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <Loading />
      ) : routes.length === 0 ? (
        <EmptyState title="Chưa có tuyến xe nào" description="Thêm tuyến đầu tiên để bắt đầu tạo chuyến." icon="ti-map-pin" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {routes.map(r => (
            <Card key={r.id} hover className="flex flex-col h-full border-l-4 border-l-[#e85d04]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between flex-1">
                <div className="min-w-0">
                  <p className="break-words font-black text-xl text-gray-900 dark:text-white flex items-center gap-2">
                    {r.originCity} <i className="ti ti-arrow-right text-[#e85d04]" /> {r.destinationCity}
                  </p>
                  <div className="mt-3 space-y-2">
                    <p className="break-words text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <i className="ti ti-map-pin text-gray-400" /> {r.originAddress || 'Chưa có điểm đón'}
                    </p>
                    <p className="break-words text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <i className="ti ti-flag text-gray-400" /> {r.destinationAddress || 'Chưa có điểm trả'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={r.isActive ? 'success' : 'default'}>
                    {r.isActive ? 'Hoạt động' : 'Ngừng'}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
