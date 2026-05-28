import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { tripAPI, routeAPI, vehicleAPI } from '../../services/api';
import { format } from 'date-fns';

const TURNAROUND_MINUTES = 60;

const STATUS_LABELS = {
  SCHEDULED: { label: 'Lịch trình', cls: 'bg-blue-100 text-blue-700' },
  BOARDING: { label: 'Đang lên xe', cls: 'bg-yellow-100 text-yellow-700' },
  DEPARTED: { label: 'Đang chạy', cls: 'bg-green-100 text-green-700' },
  COMPLETED: { label: 'Hoàn thành', cls: 'bg-gray-100 text-gray-500' },
  CANCELLED: { label: 'Đã hủy', cls: 'bg-red-100 text-red-600' },
  DELAYED: { label: 'Trễ giờ', cls: 'bg-orange-100 text-orange-700' },
};

const STATUS_ACTIONS = {
  SCHEDULED: [{ status: 'BOARDING', label: 'Mở lên xe' }, { status: 'DELAYED', label: 'Báo trễ' }, { status: 'CANCELLED', label: 'Hủy' }],
  DELAYED: [{ status: 'BOARDING', label: 'Mở lên xe' }, { status: 'CANCELLED', label: 'Hủy' }],
  BOARDING: [{ status: 'DEPARTED', label: 'Khởi hành' }, { status: 'CANCELLED', label: 'Hủy' }],
  DEPARTED: [{ status: 'COMPLETED', label: 'Hoàn thành' }],
};

const ACTIVE_TRIP_STATUSES = ['SCHEDULED', 'BOARDING', 'DELAYED', 'DEPARTED'];

const getGapMinutes = (a, b) => (new Date(b.departureTime) - new Date(a.estimatedArrival)) / 60000;

const hasScheduleConflict = (candidate, trips, excludeId = null) => {
  if (!candidate.vehicleId || !candidate.departureTime || !candidate.estimatedArrival) return null;

  const departure = new Date(candidate.departureTime);
  const arrival = new Date(candidate.estimatedArrival);
  if (Number.isNaN(departure.getTime()) || Number.isNaN(arrival.getTime())) return null;
  if (arrival <= departure) return { type: 'invalid', message: 'Giờ đến phải sau giờ khởi hành.' };

  const paddedStart = new Date(departure.getTime() - TURNAROUND_MINUTES * 60000);
  const paddedEnd = new Date(arrival.getTime() + TURNAROUND_MINUTES * 60000);

  const conflict = trips.find((trip) => {
    if (trip.id === excludeId || trip.vehicleId !== candidate.vehicleId) return false;
    if (!ACTIVE_TRIP_STATUSES.includes(trip.status)) return false;
    const tripStart = new Date(trip.departureTime);
    const tripEnd = new Date(trip.estimatedArrival);
    return paddedStart < tripEnd && paddedEnd > tripStart;
  });

  if (!conflict) return null;

  return {
    type: 'conflict',
    trip: conflict,
    message: `Xe này đang có chuyến ${conflict.route?.originCity} → ${conflict.route?.destinationCity} lúc ${format(new Date(conflict.departureTime), 'HH:mm dd/MM/yyyy')}. Cần cách tối thiểu ${TURNAROUND_MINUTES} phút.`,
  };
};

const tripHasConflict = (trip, trips) => {
  if (!ACTIVE_TRIP_STATUSES.includes(trip.status)) return false;
  return Boolean(hasScheduleConflict({
    vehicleId: trip.vehicleId,
    departureTime: trip.departureTime,
    estimatedArrival: trip.estimatedArrival,
  }, trips, trip.id));
};

export default function TripsPage() {
  const [trips, setTrips] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ routeId: '', vehicleId: '', departureTime: '', estimatedArrival: '', basePrice: '' });
  const [filters, setFilters] = useState({ date: '', routeId: '', vehicleId: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingTripId, setUpdatingTripId] = useState(null);
  const [error, setError] = useState('');

  const loadTrips = async () => {
    setError('');
    try {
      const [routeRes, vehicleRes, tripRes] = await Promise.all([
        routeAPI.getMine(),
        vehicleAPI.getMyVehicles(),
        tripAPI.getMine(),
      ]);
      setRoutes(routeRes.data.data);
      setVehicles(vehicleRes.data.data);
      setTrips(tripRes.data.data);
    } catch {
      setError('Không thể tải dữ liệu chuyến xe.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTrips(); }, []);

  const formConflict = useMemo(() => hasScheduleConflict(form, trips), [form, trips]);

  const filteredTrips = useMemo(() => trips.filter((trip) => {
    const tripDate = trip.departureTime ? format(new Date(trip.departureTime), 'yyyy-MM-dd') : '';
    return (!filters.date || tripDate === filters.date)
      && (!filters.routeId || trip.routeId === filters.routeId)
      && (!filters.vehicleId || trip.vehicleId === filters.vehicleId)
      && (!filters.status || trip.status === filters.status);
  }), [trips, filters]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (formConflict) {
      alert(formConflict.message);
      return;
    }
    setSubmitting(true);
    try {
      await tripAPI.create(form);
      setShowForm(false);
      setForm({ routeId: '', vehicleId: '', departureTime: '', estimatedArrival: '', basePrice: '' });
      loadTrips();
    } catch (err) {
      alert(err.response?.data?.message || 'Tạo chuyến xe thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (trip, status) => {
    const reason = status === 'CANCELLED' || status === 'DELAYED'
      ? window.prompt('Nhập lý do:')
      : null;
    if ((status === 'CANCELLED' || status === 'DELAYED') && !reason) return;
    if (status === 'COMPLETED' && !window.confirm('Hoàn thành chuyến này? Các vé đã thanh toán/check-in sẽ được mở đánh giá.')) return;

    setUpdatingTripId(trip.id);
    try {
      await tripAPI.updateStatus(trip.id, { status, cancelReason: reason });
      setTrips(prev => prev.map(item => item.id === trip.id ? { ...item, status, cancelReason: reason || null } : item));
    } catch (err) {
      alert(err.response?.data?.message || 'Cập nhật trạng thái thất bại.');
    } finally {
      setUpdatingTripId(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý chuyến xe</h1>
          <p className="mt-1 text-sm text-gray-500">
            Tạo chuyến, kiểm tra lịch xe và chuyển trạng thái để khách có thể đánh giá sau chuyến.
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary py-2">
          {showForm ? 'Đóng' : '+ Thêm chuyến'}
        </button>
      </div>

      {error && <div className="card mb-4 border-red-200 bg-red-50 text-sm font-medium text-red-700">{error}</div>}

      <div className="card mb-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            type="date"
            className="input"
            value={filters.date}
            onChange={e => setFilters({ ...filters, date: e.target.value })}
          />
          <select className="input" value={filters.routeId} onChange={e => setFilters({ ...filters, routeId: e.target.value })}>
            <option value="">Tất cả tuyến</option>
            {routes.map(route => (
              <option key={route.id} value={route.id}>{route.originCity} → {route.destinationCity}</option>
            ))}
          </select>
          <select className="input" value={filters.vehicleId} onChange={e => setFilters({ ...filters, vehicleId: e.target.value })}>
            <option value="">Tất cả xe</option>
            {vehicles.map(vehicle => (
              <option key={vehicle.id} value={vehicle.id}>{vehicle.licensePlate} - {vehicle.vehicleType?.name}</option>
            ))}
          </select>
          <select className="input" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
            <option value="">Tất cả trạng thái</option>
            {Object.entries(STATUS_LABELS).map(([value, item]) => (
              <option key={value} value={value}>{item.label}</option>
            ))}
          </select>
        </div>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="mb-4 font-semibold text-gray-800">Tạo chuyến xe mới</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="label">Tuyến xe</label>
              <select className="input" value={form.routeId} onChange={e => setForm({ ...form, routeId: e.target.value })} required>
                <option value="">Chọn tuyến xe</option>
                {routes.map(r => <option key={r.id} value={r.id}>{r.originCity} → {r.destinationCity}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Xe</label>
              <select className="input" value={form.vehicleId} onChange={e => setForm({ ...form, vehicleId: e.target.value })} required>
                <option value="">Chọn xe</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.licensePlate} - {v.vehicleType?.name}</option>)}
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
              <input type="number" className="input" placeholder="150000" min="1000" value={form.basePrice} onChange={e => setForm({ ...form, basePrice: e.target.value })} required />
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={submitting || Boolean(formConflict)} className="btn-primary w-full py-2">
                {submitting ? 'Đang tạo...' : 'Tạo chuyến xe'}
              </button>
            </div>
            {formConflict && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 md:col-span-2">
                {formConflict.message}
              </div>
            )}
          </form>
        </div>
      )}

      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map(item => (
            <div key={item} className="card animate-pulse">
              <div className="h-5 w-2/3 rounded bg-gray-100" />
              <div className="mt-3 h-4 w-1/2 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : trips.length === 0 ? (
        <div className="card text-center py-12">
          <p className="font-semibold text-gray-800">Chưa có chuyến xe nào</p>
          <p className="mt-1 text-sm text-gray-500">Hãy thêm chuyến đầu tiên để mở bán vé.</p>
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="card text-center py-12">
          <p className="font-semibold text-gray-800">Không có chuyến phù hợp</p>
          <p className="mt-1 text-sm text-gray-500">Thử đổi bộ lọc hoặc xóa điều kiện tìm kiếm.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredTrips.map(trip => {
            const badge = STATUS_LABELS[trip.status] || { label: trip.status, cls: 'bg-gray-100 text-gray-500' };
            const conflict = tripHasConflict(trip, trips);
            const nextSameVehicle = trips
              .filter(item => item.id !== trip.id && item.vehicleId === trip.vehicleId)
              .sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime))
              .find(item => new Date(item.departureTime) > new Date(trip.departureTime));
            const nextGap = nextSameVehicle ? Math.round(getGapMinutes(trip, nextSameVehicle)) : null;
            const actions = STATUS_ACTIONS[trip.status] || [];
            return (
              <article key={trip.id} className={`card ${conflict ? 'border-red-200' : ''}`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="break-words font-semibold text-gray-800">
                        {trip.route?.originCity} → {trip.route?.destinationCity}
                      </p>
                      <span className={`badge ${badge.cls}`}>{badge.label}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {format(new Date(trip.departureTime), 'HH:mm dd/MM/yyyy')} · {trip.vehicle?.licensePlate} · Còn {trip._count?.tripSeats ?? 0} ghế
                    </p>
                    {nextGap !== null && nextGap >= 0 && nextGap < TURNAROUND_MINUTES && (
                      <p className="mt-1 text-xs font-semibold text-orange-600">
                        Xe chỉ nghỉ {nextGap} phút trước chuyến kế tiếp.
                      </p>
                    )}
                    {conflict && (
                      <p className="mt-1 text-xs font-semibold text-red-600">
                        Cảnh báo: lịch xe đang chồng thời gian hoặc thiếu thời gian quay đầu.
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 lg:items-end">
                    <span className="font-semibold text-brand">{Number(trip.basePrice).toLocaleString('vi-VN')}đ</span>
                    <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                      <Link to={`/operator/trips/${trip.id}/check-in`} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                        Soát vé
                      </Link>
                      {actions.map(action => (
                        <button
                          key={action.status}
                          onClick={() => handleStatusChange(trip, action.status)}
                          disabled={updatingTripId === trip.id}
                          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                            action.status === 'COMPLETED'
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              : action.status === 'CANCELLED'
                                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {updatingTripId === trip.id ? 'Đang cập nhật...' : action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
