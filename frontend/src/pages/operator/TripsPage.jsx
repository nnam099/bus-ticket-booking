import { useEffect, useState } from 'react';
import { tripAPI, routeAPI, vehicleAPI } from '../../services/api';
import { format } from 'date-fns';

const STATUS_LABELS = {
  SCHEDULED: { label: 'Lịch trình', cls: 'bg-blue-100 text-blue-700' },
  BOARDING:  { label: 'Đang lên xe', cls: 'bg-yellow-100 text-yellow-700' },
  ON_ROUTE:  { label: 'Đang chạy', cls: 'bg-green-100 text-green-700' },
  COMPLETED: { label: 'Hoàn thành', cls: 'bg-gray-100 text-gray-500' },
  CANCELLED: { label: 'Đã hủy', cls: 'bg-red-100 text-red-600' },
  DELAYED:   { label: 'Trễ giờ', cls: 'bg-orange-100 text-orange-700' },
};

export default function TripsPage() {
  const [trips, setTrips] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ routeId: '', vehicleId: '', departureTime: '', estimatedArrival: '', basePrice: '' });
  const [loading, setLoading] = useState(false);

  const loadTrips = () => {
    // For operator's own trips - in real app this would filter by operator
    routeAPI.getAll().then(r => {
      const routeIds = r.data.data.map(rt => rt.id);
      setRoutes(r.data.data);
      // Simplified: show empty until we add a proper operator trips endpoint
      setTrips([]);
    });
    vehicleAPI.getMyVehicles().then(r => setVehicles(r.data.data));
  };

  useEffect(() => { loadTrips(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await tripAPI.create(form);
      setShowForm(false);
      setForm({ routeId: '', vehicleId: '', departureTime: '', estimatedArrival: '', basePrice: '' });
      loadTrips();
    } catch (err) {
      alert(err.response?.data?.message || 'Tạo chuyến xe thất bại.');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý chuyến xe</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary py-2">
          {showForm ? 'Đóng' : '+ Thêm chuyến'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">Tạo chuyến xe mới</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-3">
            <div className="col-span-2 md:col-span-1">
              <label className="label">Tuyến xe</label>
              <select className="input" value={form.routeId} onChange={e => setForm({ ...form, routeId: e.target.value })} required>
                <option value="">Chọn tuyến xe</option>
                {routes.map(r => <option key={r.id} value={r.id}>{r.originCity} → {r.destinationCity}</option>)}
              </select>
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="label">Xe</label>
              <select className="input" value={form.vehicleId} onChange={e => setForm({ ...form, vehicleId: e.target.value })} required>
                <option value="">Chọn xe</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.licensePlate} — {v.vehicleType?.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Giờ khởi hành</label>
              <input type="datetime-local" className="input" value={form.departureTime} onChange={e => setForm({ ...form, departureTime: e.target.value })} required />
            </div>
            <div>
              <label className="label">Giờ đến dự kiến</label>
              <input type="datetime-local" className="input" value={form.estimatedArrival} onChange={e => setForm({ ...form, estimatedArrival: e.target.value })} required />
            </div>
            <div>
              <label className="label">Giá vé (đ)</label>
              <input type="number" className="input" placeholder="150000" value={form.basePrice} onChange={e => setForm({ ...form, basePrice: e.target.value })} required />
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={loading} className="btn-primary py-2 w-full">
                {loading ? 'Đang tạo...' : 'Tạo chuyến xe'}
              </button>
            </div>
          </form>
        </div>
      )}

      {trips.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <div className="text-4xl mb-3">📅</div>
          <p>Chưa có chuyến xe nào. Hãy thêm chuyến đầu tiên!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map(trip => {
            const badge = STATUS_LABELS[trip.status] || { label: trip.status, cls: 'bg-gray-100 text-gray-500' };
            return (
              <div key={trip.id} className="card flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">
                    {trip.route?.originCity} → {trip.route?.destinationCity}
                  </p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(trip.departureTime), 'HH:mm dd/MM/yyyy')} •{' '}
                    {trip.vehicle?.licensePlate}
                  </p>
                </div>
                <span className={`badge ${badge.cls}`}>{badge.label}</span>
                <span className="font-semibold text-brand">{Number(trip.basePrice).toLocaleString('vi-VN')}đ</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
