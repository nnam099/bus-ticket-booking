// RoutesPage.jsx
import { useEffect, useState } from 'react';
import { routeAPI } from '../../services/api';

export default function RoutesPage() {
  const [routes, setRoutes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ originCity: '', destinationCity: '', originAddress: '', destinationAddress: '', durationMinutes: '' });

  useEffect(() => { routeAPI.getAll().then(r => setRoutes(r.data.data)); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await routeAPI.create(form);
      setShowForm(false);
      routeAPI.getAll().then(r => setRoutes(r.data.data));
    } catch (err) { alert(err.response?.data?.message || 'Lỗi'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý tuyến xe</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary py-2">+ Thêm tuyến</button>
      </div>
      {showForm && (
        <div className="card mb-6">
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-3">
            <div><label className="label">Điểm đi</label><input className="input" value={form.originCity} onChange={e => setForm({ ...form, originCity: e.target.value })} required /></div>
            <div><label className="label">Điểm đến</label><input className="input" value={form.destinationCity} onChange={e => setForm({ ...form, destinationCity: e.target.value })} required /></div>
            <div><label className="label">Địa chỉ đón</label><input className="input" value={form.originAddress} onChange={e => setForm({ ...form, originAddress: e.target.value })} /></div>
            <div><label className="label">Địa chỉ trả</label><input className="input" value={form.destinationAddress} onChange={e => setForm({ ...form, destinationAddress: e.target.value })} /></div>
            <div className="col-span-2 flex gap-2"><button type="submit" className="btn-primary py-2">Tạo tuyến</button><button type="button" onClick={() => setShowForm(false)} className="btn-outline py-2">Hủy</button></div>
          </form>
        </div>
      )}
      <div className="space-y-3">
        {routes.map(r => (
          <div key={r.id} className="card flex items-center justify-between">
            <div>
              <p className="font-semibold">{r.originCity} → {r.destinationCity}</p>
              <p className="text-sm text-gray-500">{r.operator?.companyName}</p>
            </div>
            <span className={`badge ${r.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {r.isActive ? 'Hoạt động' : 'Ngừng'}
            </span>
          </div>
        ))}
        {routes.length === 0 && <div className="card text-center py-12 text-gray-500"><p>Chưa có tuyến xe nào.</p></div>}
      </div>
    </div>
  );
}
