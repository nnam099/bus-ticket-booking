import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { tripAPI, routeAPI, vehicleAPI } from '../../services/api';
import { format } from 'date-fns';
import { PageHeader, Card, Input, Select, Button, Badge, EmptyState, Loading } from '../../components/ui';

const TURNAROUND_MINUTES = 60;

const STATUS_LABELS = {
  SCHEDULED: { label: 'Lịch trình', cls: 'info' },
  BOARDING: { label: 'Đang lên xe', cls: 'warning' },
  DEPARTED: { label: 'Đang chạy', cls: 'success' },
  COMPLETED: { label: 'Hoàn thành', cls: 'default' },
  CANCELLED: { label: 'Đã hủy', cls: 'danger' },
  DELAYED: { label: 'Trễ giờ', cls: 'warning' },
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
    <div className="space-y-6">
      <PageHeader 
        title="Quản lý chuyến xe" 
        description="Tạo chuyến, kiểm tra lịch xe và chuyển trạng thái để khách có thể đánh giá sau chuyến."
        actions={
          <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'outline' : 'primary'} icon={<i className={`ti ${showForm ? 'ti-x' : 'ti-plus'}`} />}>
            {showForm ? 'Đóng' : 'Thêm chuyến'}
          </Button>
        }
      />

      {error && <Card className="border-red-200 bg-red-50 text-red-700">{error}</Card>}

      <Card>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Input
            type="date"
            value={filters.date}
            onChange={e => setFilters({ ...filters, date: e.target.value })}
          />
          <Select 
            value={filters.routeId} 
            onChange={e => setFilters({ ...filters, routeId: e.target.value })}
            options={[
              { value: '', label: 'Tất cả tuyến' },
              ...routes.map(route => ({ value: route.id, label: `${route.originCity} → ${route.destinationCity}` }))
            ]}
          />
          <Select 
            value={filters.vehicleId} 
            onChange={e => setFilters({ ...filters, vehicleId: e.target.value })}
            options={[
              { value: '', label: 'Tất cả xe' },
              ...vehicles.map(vehicle => ({ value: vehicle.id, label: `${vehicle.licensePlate} - ${vehicle.vehicleType?.name}` }))
            ]}
          />
          <Select 
            value={filters.status} 
            onChange={e => setFilters({ ...filters, status: e.target.value })}
            options={[
              { value: '', label: 'Tất cả trạng thái' },
              ...Object.entries(STATUS_LABELS).map(([value, item]) => ({ value, label: item.label }))
            ]}
          />
        </div>
      </Card>

      {showForm && (
        <Card className="border-[#e85d04]/20 bg-orange-50/50 dark:bg-[#e85d04]/10 page-enter">
          <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Tạo chuyến xe mới</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Select 
              label="Tuyến xe" 
              value={form.routeId} 
              onChange={e => setForm({ ...form, routeId: e.target.value })} 
              required
              options={[
                { value: '', label: 'Chọn tuyến xe' },
                ...routes.map(r => ({ value: r.id, label: `${r.originCity} → ${r.destinationCity}` }))
              ]}
            />
            <Select 
              label="Xe" 
              value={form.vehicleId} 
              onChange={e => setForm({ ...form, vehicleId: e.target.value })} 
              required
              options={[
                { value: '', label: 'Chọn xe' },
                ...vehicles.map(v => ({ value: v.id, label: `${v.licensePlate} - ${v.vehicleType?.name}` }))
              ]}
            />
            <Input 
              type="datetime-local" 
              label="Giờ khởi hành" 
              value={form.departureTime} 
              onChange={e => setForm({ ...form, departureTime: e.target.value })} 
              required 
            />
            <Input 
              type="datetime-local" 
              label="Giờ đến dự kiến" 
              value={form.estimatedArrival} 
              onChange={e => setForm({ ...form, estimatedArrival: e.target.value })} 
              required 
            />
            <Input 
              type="number" 
              label="Giá vé (đ)" 
              placeholder="150000" 
              min="1000" 
              value={form.basePrice} 
              onChange={e => setForm({ ...form, basePrice: e.target.value })} 
              required 
            />
            <div className="flex items-end mt-2 md:mt-0">
              <Button type="submit" disabled={submitting || Boolean(formConflict)} fullWidth>
                {submitting ? 'Đang tạo...' : 'Tạo chuyến xe'}
              </Button>
            </div>
            {formConflict && (
              <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm font-bold text-red-700 dark:text-red-400 md:col-span-2 flex items-center gap-2">
                <i className="ti ti-alert-triangle" /> {formConflict.message}
              </div>
            )}
          </form>
        </Card>
      )}

      {loading ? (
        <Loading />
      ) : trips.length === 0 ? (
        <EmptyState title="Chưa có chuyến xe nào" description="Hãy thêm chuyến đầu tiên để mở bán vé." icon="ti-calendar-event" />
      ) : filteredTrips.length === 0 ? (
        <EmptyState title="Không có chuyến phù hợp" description="Thử đổi bộ lọc hoặc xóa điều kiện tìm kiếm." icon="ti-search" />
      ) : (
        <div className="grid gap-4">
          {filteredTrips.map(trip => {
            const badge = STATUS_LABELS[trip.status] || { label: trip.status, cls: 'default' };
            const conflict = tripHasConflict(trip, trips);
            const nextSameVehicle = trips
              .filter(item => item.id !== trip.id && item.vehicleId === trip.vehicleId)
              .sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime))
              .find(item => new Date(item.departureTime) > new Date(trip.departureTime));
            const nextGap = nextSameVehicle ? Math.round(getGapMinutes(trip, nextSameVehicle)) : null;
            const actions = STATUS_ACTIONS[trip.status] || [];
            
            return (
              <Card key={trip.id} hover className={`flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-l-4 ${conflict ? 'border-red-500' : 'border-[#e85d04]'}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="break-words font-black text-xl text-gray-900 dark:text-white">
                      {trip.route?.originCity} <i className="ti ti-arrow-right text-[#e85d04] mx-1" /> {trip.route?.destinationCity}
                    </p>
                    <Badge variant={badge.cls}>{badge.label}</Badge>
                  </div>
                  
                  <div className="mt-3 flex flex-wrap gap-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1.5"><i className="ti ti-calendar text-gray-400" /> {format(new Date(trip.departureTime), 'HH:mm dd/MM/yyyy')}</span>
                    <span className="flex items-center gap-1.5"><i className="ti ti-bus text-gray-400" /> {trip.vehicle?.licensePlate}</span>
                    <span className="flex items-center gap-1.5"><i className="ti ti-armchair text-[#e85d04]" /> Còn {trip._count?.tripSeats ?? 0} ghế</span>
                  </div>

                  {nextGap !== null && nextGap >= 0 && nextGap < TURNAROUND_MINUTES && (
                    <p className="mt-3 text-sm font-bold text-orange-600 dark:text-orange-400 flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 px-3 py-2 rounded-lg inline-flex">
                      <i className="ti ti-clock" /> Xe chỉ nghỉ {nextGap} phút trước chuyến kế tiếp.
                    </p>
                  )}
                  {conflict && (
                    <p className="mt-3 text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg inline-flex">
                      <i className="ti ti-alert-triangle" /> Cảnh báo: lịch xe đang chồng thời gian hoặc thiếu thời gian quay đầu.
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-3 lg:items-end border-t lg:border-t-0 pt-3 lg:pt-0 border-gray-100 dark:border-slate-800">
                  <span className="font-black text-2xl text-[#e85d04]">{Number(trip.basePrice).toLocaleString('vi-VN')}đ</span>
                  
                  <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end mt-1">
                    <Link to={`/operator/trips/${trip.id}/check-in`}>
                      <Button variant="outline" size="sm" icon={<i className="ti ti-ticket" />}>Soát vé</Button>
                    </Link>
                    
                    {actions.map(action => {
                      const isDanger = action.status === 'CANCELLED';
                      const isPrimary = action.status === 'COMPLETED';
                      
                      return (
                        <Button
                          key={action.status}
                          onClick={() => handleStatusChange(trip, action.status)}
                          disabled={updatingTripId === trip.id}
                          variant={isDanger ? 'danger' : isPrimary ? 'primary' : 'outline'}
                          size="sm"
                        >
                          {updatingTripId === trip.id ? 'Đang cập nhật...' : action.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
