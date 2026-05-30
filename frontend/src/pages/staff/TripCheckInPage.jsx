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
  PAID: { label: 'Chờ lên xe', cls: 'bg-amber-100 text-amber-700' },
  CHECKED_IN: { label: 'Đã lên xe', cls: 'bg-emerald-100 text-emerald-700' },
  COMPLETED: { label: 'Hoàn thành', cls: 'bg-blue-100 text-blue-700' },
};

const isCheckedIn = (ticket) => Boolean(ticket?.checkedInAt || ticket?.status === 'CHECKED_IN' || ticket?.status === 'COMPLETED');

const sortBySeat = (a, b) => {
  const seatA = a?.tripSeat?.seatLayout || a?.seatLayout || {};
  const seatB = b?.tripSeat?.seatLayout || b?.seatLayout || {};
  return (seatA.floor || 0) - (seatB.floor || 0)
    || (seatA.row || 0) - (seatB.row || 0)
    || (seatA.col || 0) - (seatB.col || 0)
    || String(seatA.seatCode || '').localeCompare(String(seatB.seatCode || ''), 'vi');
};

export default function TripCheckInPage() {
  const { tripId } = useParams();
  const [trip, setTrip] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [seats, setSeats] = useState([]);
  const [tripStatus, setTripStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkingTicketId, setCheckingTicketId] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    staffAPI.getPassengers(tripId)
      .then((res) => {
        const payload = res.data.data;
        if (Array.isArray(payload)) {
          setPassengers([...payload].sort(sortBySeat));
          setSeats(payload.map((ticket) => ({ ...ticket.tripSeat, ticket })).sort(sortBySeat));
          return;
        }
        setTrip(payload.trip || null);
        setPassengers([...(payload.passengers || [])].sort(sortBySeat));
        setSeats([...(payload.seats || [])].sort(sortBySeat));
      })
      .catch(() => setError('Không thể tải danh sách hành khách.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [tripId]);

  const checkedIn = useMemo(() => passengers.filter(isCheckedIn).length, [passengers]);
  const soldSeats = useMemo(() => seats.filter((seat) => seat.ticket).length || passengers.length, [seats, passengers]);
  const progress = soldSeats ? Math.round((checkedIn / soldSeats) * 100) : 0;
  const canComplete = soldSeats > 0 && checkedIn === soldSeats;
  const floors = useMemo(
    () => [...new Set(seats.map((seat) => seat.seatLayout?.floor).filter(Boolean))].sort((a, b) => a - b),
    [seats],
  );

  const handleCheckIn = async (ticket) => {
    if (!ticket || isCheckedIn(ticket)) return;
    const seatCode = ticket.tripSeat?.seatLayout?.seatCode || seats.find((seat) => seat.id === ticket.tripSeatId)?.seatLayout?.seatCode;
    const ok = window.confirm(`Xác nhận hành khách ${ticket.passengerName || ''} đã lên xe tại ghế ${seatCode || ''}?`);
    if (!ok) return;

    setCheckingTicketId(ticket.id);
    try {
      const res = await ticketAPI.checkIn(ticket.id);
      const updated = { ...ticket, ...res.data.data, checkedInAt: res.data.data?.checkedInAt || new Date().toISOString(), status: 'CHECKED_IN' };
      setPassengers(prev => prev.map(item => (item.id === ticket.id ? updated : item)));
      setSeats(prev => prev.map(seat => (seat.ticket?.id === ticket.id ? { ...seat, ticket: { ...seat.ticket, ...updated } } : seat)));
    } catch (err) {
      alert(err.response?.data?.message || 'Xác nhận lên xe thất bại.');
    } finally {
      setCheckingTicketId(null);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (status === 'COMPLETED' && !canComplete && !window.confirm('Vẫn còn hành khách chưa lên xe. Bạn muốn hoàn thành chuyến?')) {
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
        setPassengers(prev => prev.map(ticket => ({ ...ticket, status: 'COMPLETED' })));
        setSeats(prev => prev.map(seat => (seat.ticket ? { ...seat, ticket: { ...seat.ticket, status: 'COMPLETED' } } : seat)));
      }
      alert(status === 'COMPLETED' ? 'Đã hoàn thành chuyến. Khách có thể đánh giá vé.' : 'Cập nhật trạng thái thành công.');
    } catch (err) {
      alert(err.response?.data?.message || 'Cập nhật trạng thái thất bại.');
    } finally {
      setUpdating(false);
    }
  };

  const renderSeat = (seat) => {
    if (!seat) return <div className="h-16 rounded-xl border border-dashed border-gray-100 bg-gray-50/60" />;

    const ticket = seat.ticket;
    const checked = isCheckedIn(ticket);
    const badge = ticket ? TICKET_BADGES[ticket.status] || TICKET_BADGES.PAID : null;
    const disabled = !ticket || checked || checkingTicketId === ticket.id;

    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => handleCheckIn(ticket)}
        title={ticket ? `${seat.seatLayout.seatCode} - ${ticket.passengerName || 'Hành khách'}` : `${seat.seatLayout.seatCode} - Ghế trống`}
        className={`flex h-16 min-w-0 flex-col items-center justify-center rounded-xl border px-2 text-center text-xs font-semibold transition ${
          !ticket
            ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
            : checked
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-amber-200 bg-amber-50 text-amber-800 hover:border-brand hover:bg-orange-50 hover:text-brand'
        }`}
      >
        <span className="text-sm font-black">{seat.seatLayout.seatCode}</span>
        <span className="mt-0.5 max-w-full truncate">{ticket ? (checked ? 'Đã lên xe' : 'Xác nhận') : 'Trống'}</span>
        {checkingTicketId === ticket?.id && <span className="mt-0.5 text-[10px]">Đang lưu...</span>}
      </button>
    );
  };

  const renderFloor = (floor) => {
    const floorSeats = seats.filter(seat => seat.seatLayout?.floor === floor);
    const rows = [...new Set(floorSeats.map(seat => seat.seatLayout.row))].sort((a, b) => a - b);
    const maxCol = Math.max(...floorSeats.map(seat => seat.seatLayout.col));
    const aisleAfter = Math.ceil(maxCol / 2);
    const leftCols = Array.from({ length: aisleAfter }, (_, index) => index + 1);
    const rightCols = Array.from({ length: maxCol - aisleAfter }, (_, index) => aisleAfter + index + 1);
    const gridTemplateColumns = `2rem repeat(${leftCols.length}, minmax(3.5rem, 1fr)) minmax(1rem, 1.5rem) repeat(${rightCols.length}, minmax(3.5rem, 1fr))`;

    return (
      <section key={floor} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-bold text-gray-800">{floors.length > 1 ? `Tầng ${floor}` : 'Sơ đồ chỗ ngồi'}</h2>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">{floorSeats.length} ghế</span>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-slate-50 p-4">
          <div className="mb-4 flex items-center justify-between rounded-xl bg-white px-4 py-3 text-xs font-semibold text-gray-500">
            <span>Cửa lên</span>
            <span>Tài xế</span>
          </div>
          <div className="grid gap-2" style={{ gridTemplateColumns }}>
            <div />
            {leftCols.map(col => <div key={`left-${col}`} className="text-center text-xs font-semibold text-gray-400">Dãy {col}</div>)}
            <div />
            {rightCols.map(col => <div key={`right-${col}`} className="text-center text-xs font-semibold text-gray-400">Dãy {col}</div>)}

            {rows.map((row) => {
              const rowSeats = floorSeats.filter(seat => seat.seatLayout.row === row);
              return (
                <div key={row} className="contents">
                  <span className="flex items-center justify-center text-xs font-bold text-gray-400">{row}</span>
                  {leftCols.map(col => (
                    <div key={`${row}-${col}`}>
                      {renderSeat(rowSeats.find(seat => seat.seatLayout.col === col))}
                    </div>
                  ))}
                  <div className="rounded-full bg-white/70" />
                  {rightCols.map(col => (
                    <div key={`${row}-${col}`}>
                      {renderSeat(rowSeats.find(seat => seat.seatLayout.col === col))}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Soát vé chuyến xe</h1>
            <p className="mt-1 text-sm text-gray-500">
              {checkedIn}/{soldSeats} hành khách đã lên xe. Bấm vào ghế có khách để xác nhận khách đã lên xe.
            </p>
            {trip && (
              <p className="mt-2 text-sm font-semibold text-gray-700">
                {trip.route?.originCity} → {trip.route?.destinationCity} · {trip.vehicle?.licensePlate || 'Chưa gán xe'}
              </p>
            )}
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
            <span>Tiến độ lên xe</span>
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
      ) : seats.length === 0 ? (
        <div className="card text-center py-14">
          <p className="font-semibold text-gray-800">Chưa có sơ đồ ghế</p>
          <p className="mt-1 text-sm text-gray-500">Chuyến này chưa có dữ liệu chỗ ngồi.</p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-xs shadow-sm">
              {[
                { cls: 'border-amber-200 bg-amber-50', label: 'Có khách, chờ xác nhận' },
                { cls: 'border-emerald-200 bg-emerald-50', label: 'Đã lên xe' },
                { cls: 'border-gray-200 bg-gray-50', label: 'Ghế trống' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className={`h-4 w-4 rounded border ${item.cls}`} />
                  <span className="font-medium text-gray-600">{item.label}</span>
                </div>
              ))}
            </div>
            {floors.map(renderFloor)}
          </div>

          <aside className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-gray-800">Danh sách hành khách</h2>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">{passengers.length}</span>
            </div>
            {passengers.length === 0 ? (
              <div className="rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-500">
                Danh sách sẽ xuất hiện khi khách thanh toán vé.
              </div>
            ) : (
              <div className="space-y-3">
                {passengers.map((passenger) => {
                  const badge = TICKET_BADGES[passenger.status] || TICKET_BADGES.PAID;
                  const checked = isCheckedIn(passenger);
                  const seatCode = passenger.tripSeat?.seatLayout?.seatCode || seats.find(seat => seat.id === passenger.tripSeatId)?.seatLayout?.seatCode;
                  return (
                    <article key={passenger.id} className={`rounded-xl border p-3 ${checked ? 'border-emerald-100 bg-emerald-50/70' : 'border-gray-100 bg-white'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-800">{passenger.passengerName}</p>
                          <p className="mt-1 text-sm text-gray-500">Ghế {seatCode || '-'} · {passenger.passengerPhone || '-'}</p>
                        </div>
                        <span className={`badge shrink-0 ${badge.cls}`}>{checked ? 'Đã lên xe' : badge.label}</span>
                      </div>
                      {!checked && (
                        <button
                          type="button"
                          onClick={() => handleCheckIn(passenger)}
                          disabled={checkingTicketId === passenger.id}
                          className="mt-3 w-full rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {checkingTicketId === passenger.id ? 'Đang xác nhận...' : 'Xác nhận lên xe'}
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
