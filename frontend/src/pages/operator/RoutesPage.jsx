import { useEffect, useState } from 'react';
import { routeAPI } from '../../services/api';

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
    <div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý tuyến xe</h1>
          <p className="mt-1 text-sm text-gray-500">Tuyến xe là nền tảng để tạo chuyến và mở bán vé.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary py-2">
          {showForm ? 'Đóng' : '+ Thêm tuyến'}
        </button>
      </div>

      {error && <div className="card mb-4 border-red-200 bg-red-50 text-sm font-medium text-red-700">{error}</div>}

      {showForm && (
        <div className="card mb-6">
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="label">Điểm đi</label>
              <input className="input" value={form.originCity} onChange={e => setForm({ ...form, originCity: e.target.value })} required />
            </div>
            <div>
              <label className="label">Điểm đến</label>
              <input className="input" value={form.destinationCity} onChange={e => setForm({ ...form, destinationCity: e.target.value })} required />
            </div>
            <div>
              <label className="label">Địa chỉ đón</label>
              <input className="input" value={form.originAddress} onChange={e => setForm({ ...form, originAddress: e.target.value })} />
            </div>
            <div>
              <label className="label">Địa chỉ trả</label>
              <input className="input" value={form.destinationAddress} onChange={e => setForm({ ...form, destinationAddress: e.target.value })} />
            </div>
            <div className="flex gap-2 md:col-span-2">
              <button type="submit" className="btn-primary py-2">Tạo tuyến</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline py-2">Hủy</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map(item => (
            <div key={item} className="card animate-pulse">
              <div className="h-5 w-52 rounded bg-gray-100" />
              <div className="mt-3 h-4 w-72 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : routes.length === 0 ? (
        <div className="card text-center py-14">
          <p className="font-semibold text-gray-800">Chưa có tuyến xe nào</p>
          <p className="mt-1 text-sm text-gray-500">Thêm tuyến đầu tiên để bắt đầu tạo chuyến.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {routes.map(r => (
            <article key={r.id} className="card">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="break-words font-semibold text-gray-800">{r.originCity} → {r.destinationCity}</p>
                  <p className="mt-1 break-words text-sm text-gray-500">{r.originAddress || '-'} → {r.destinationAddress || '-'}</p>
                </div>
                <span className={`badge ${r.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {r.isActive ? 'Hoạt động' : 'Ngừng'}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
