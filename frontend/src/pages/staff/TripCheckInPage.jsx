import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { staffAPI, ticketAPI, tripAPI } from '../../services/api';

const STATUS_ACTIONS = [
  { value: 'BOARDING', label: 'Mở lên xe' },
  { value: 'DEPARTED', label: 'Khởi hành' },
  { value: 'COMPLETED', label: 'Hoàn thành chuyến' },
  { value: 'DELAYED', label: 'Báo trễ' },
  { value: 'CANCELLED', label: 'Hủy chuyến' },
];

const TICKET_BADGES = {
  PAID: { label: 'Đã thanh toán', cls: 'bg-green-100 text-green-700' },
  CHECKED_IN: { label: 'Đã lên xe', cls: 'bg-emerald-100 text-emerald-700' },
  COMPLETED: { label: 'Hoàn thành', cls: 'bg-blue-100 text-blue-700' },
};

export default function TripCheckInPage() {
  const { tripId } = useParams();
  const [passengers, setPassengers] = useState([]);
  const [tripStatus, setTripStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    staffAPI.getPassengers(tripId)
      .then(r => setPassengers(r.data.data))
      .catch(() => setError('Không thể tải danh sách hành khách.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [tripId]);

  const checkedIn = useMemo(() => passengers.filter(p => p.checkedInAt || p.status === 'COMPLETED').length, [passengers]);
  const progress = passengers.length ? Math.round((checkedIn / passengers.length) * 100) : 0;
  const canComplete = passengers.length > 0 && checkedIn === passengers.length;

  const handleCheckIn = async (ticketId) => {
    try {
      await ticketAPI.checkIn(ticketId);
      setPassengers(prev => prev.map(p => p.id === ticketId ? { ...p, checkedInAt: new Date().toISOString(), status: 'CHECKED_IN' } : p));
    } catch (err) {
      alert(err.response?.data?.message || 'Xác nhận lên xe thất bại.');
    }
  };

  const handleUpdateStatus = async (status) => {
    if (status === 'COMPLETED' && !canComplete && !window.confirm('Vẫn còn hành khách chưa check-in. Bạn muốn hoàn thành chuyến?')) {
      return;
    }
    const reason = status === 'CANCELLED' || status === 'DELAYED'
      ? window.prompt('Nhập lý do:')
      : null;
    if ((status === 'CANCELLED' || status === 'DELAYED') && !reason) return;

    setUpdating(true);
    try {
      await tripAPI.updateStatus(tripId, { status, cancelReason: reason });
      setTripStatus(status);
      if (status === 'COMPLETED') {
        setPassengers(prev => prev.map(p => ({ ...p, status: 'COMPLETED' })));
      }
      alert(status === 'COMPLETED' ? 'Đã hoàn thành chuyến. Khách có thể đánh giá vé.' : 'Cập nhật trạng thái thành công.');
    } catch (err) {
      alert(err.response?.data?.message || 'Cập nhật trạng thái thất bại.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Soát vé chuyến xe</h1>
            <p className="mt-1 text-sm text-gray-500">
              {checkedIn}/{passengers.length} hành khách đã lên xe. Khi hoàn thành chuyến, vé sẽ mở quyền đánh giá.
            </p>
            {tripStatus && <p className="mt-2 text-sm font-semibold text-brand">Trạng thái mới: {tripStatus}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_ACTIONS.map(action => (
              <button
                key={action.value}
                disabled={updating}
                onClick={() => handleUpdateStatus(action.value)}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  action.value === 'COMPLETED'
                    ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex justify-between text-xs font-semibold text-gray-500">
            <span>Tiến độ check-in</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {error && <div className="card mb-4 border-red-200 bg-red-50 text-sm font-medium text-red-700">{error}</div>}

      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map(item => (
            <div key={item} className="card animate-pulse">
              <div className="h-5 w-1/3 rounded bg-gray-100" />
              <div className="mt-3 h-4 w-1/2 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : passengers.length === 0 ? (
        <div className="card text-center py-14">
          <p className="font-semibold text-gray-800">Chưa có hành khách nào</p>
          <p className="mt-1 text-sm text-gray-500">Danh sách sẽ xuất hiện khi khách thanh toán vé.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {passengers.map(p => {
            const badge = TICKET_BADGES[p.status] || TICKET_BADGES.PAID;
            const checked = p.checkedInAt || p.status === 'COMPLETED';
            return (
              <article key={p.id} className={`card ${checked ? 'border-green-200 bg-green-50' : ''}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-gray-800">{p.passengerName}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Ghế {p.tripSeat?.seatLayout?.seatCode} · {p.passengerPhone || '-'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`badge ${badge.cls}`}>{badge.label}</span>
                    {!checked && (
                      <button onClick={() => handleCheckIn(p.id)} className="btn-primary px-4 py-2 text-sm">
                        Xác nhận lên xe
                      </button>
                    )}
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
