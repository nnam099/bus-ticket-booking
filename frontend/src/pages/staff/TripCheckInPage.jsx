import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { staffAPI, ticketAPI, tripAPI } from '../../services/api';
import { PageHeader, Card, Button, Badge, Loading, EmptyState } from '../../components/ui';

const STATUS_ACTIONS = [
  { value: 'BOARDING', label: 'Bắt đầu đón khách' },
  { value: 'DEPARTED', label: 'Bắt đầu chuyến' },
  { value: 'DELAYED', label: 'Đang di chuyển' }, // Map DELAYED to "Đang di chuyển" or just use local state? Actually the user said "Đang di chuyển" as an action.
  { value: 'COMPLETED', label: 'Đã đến điểm (Kết thúc)' },
  { value: 'CANCELLED', label: 'Hủy chuyến' },
];

const TICKET_BADGES = {
  PAID: { label: 'Chờ lên xe', cls: 'warning' },
  CHECKED_IN: { label: 'Đã lên xe', cls: 'success' },
  COMPLETED: { label: 'Hoàn thành', cls: 'default' },
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
    if (!seat) return <div className="h-16 rounded-xl border border-dashed border-gray-200 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-800/30" />;

    const ticket = seat.ticket;
    const checked = isCheckedIn(ticket);
    const disabled = !ticket || checked || checkingTicketId === ticket.id;

    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => handleCheckIn(ticket)}
        title={ticket ? `${seat.seatLayout.seatCode} - ${ticket.passengerName || 'Hành khách'}` : `${seat.seatLayout.seatCode} - Ghế trống`}
        className={`flex h-16 min-w-0 flex-col items-center justify-center rounded-xl border px-2 text-center text-xs font-semibold transition ${
          !ticket
            ? 'cursor-not-allowed border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-gray-500'
            : checked
              ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 shadow-sm'
              : 'border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 hover:border-[#e85d04] hover:bg-orange-50 dark:hover:bg-[#e85d04]/10 hover:text-[#e85d04] shadow-sm'
        }`}
      >
        <span className="text-sm font-black">{seat.seatLayout.seatCode}</span>
        <span className="mt-0.5 max-w-full truncate opacity-90">{ticket ? (checked ? 'Đã lên xe' : 'Xác nhận') : 'Trống'}</span>
        {checkingTicketId === ticket?.id && <span className="mt-0.5 text-[10px] animate-pulse">Đang lưu...</span>}
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
      <Card key={floor} className="shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-gray-100 dark:border-slate-800 pb-3">
          <h2 className="font-bold text-gray-800 dark:text-white text-lg flex items-center gap-2">
            <i className="ti ti-stairs text-gray-400" />
            {floors.length > 1 ? `Tầng ${floor}` : 'Sơ đồ chỗ ngồi'}
          </h2>
          <Badge variant="default">{floorSeats.length} ghế</Badge>
        </div>

        <div className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-4">
          <div className="mb-5 flex items-center justify-between rounded-xl bg-white dark:bg-slate-800 px-5 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 shadow-sm border border-gray-100 dark:border-slate-700">
            <span className="flex items-center gap-1.5"><i className="ti ti-door-enter" /> Cửa lên</span>
            <span className="flex items-center gap-1.5"><i className="ti ti-steering-wheel text-lg" /> Tài xế</span>
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
                  <span className="flex items-center justify-center text-xs font-black text-gray-400 bg-gray-100 dark:bg-slate-800 rounded-lg h-16">{row}</span>
                  {leftCols.map(col => (
                    <div key={`${row}-${col}`}>
                      {renderSeat(rowSeats.find(seat => seat.seatLayout.col === col))}
                    </div>
                  ))}
                  <div className="rounded-full bg-white/50 dark:bg-slate-800/50" />
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
      </Card>
    );
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Card className="shadow-sm border-[#e85d04]/20 bg-orange-50/10 dark:bg-[#e85d04]/5">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <i className="ti ti-ticket text-[#e85d04]" /> Soát vé chuyến xe
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              <strong className="text-[#e85d04]">{checkedIn}/{soldSeats}</strong> hành khách đã lên xe. Bấm vào ghế có khách để xác nhận.
            </p>
            {trip && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-4 rounded-xl">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <i className="ti ti-map-pin text-emerald-500 mt-0.5" />
                    <div>
                      <span className="text-xs text-gray-500 block">Điểm đón ({trip.route?.originCity})</span>
                      <span className="font-semibold">{trip.route?.originAddress}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <i className="ti ti-map-pin text-rose-500 mt-0.5" />
                    <div>
                      <span className="text-xs text-gray-500 block">Điểm trả ({trip.route?.destinationCity})</span>
                      <span className="font-semibold">{trip.route?.destinationAddress}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <i className="ti ti-bus text-blue-500 mt-0.5" />
                    <div>
                      <span className="text-xs text-gray-500 block">Xe được giao</span>
                      <span className="font-semibold">{trip.vehicle?.licensePlate} ({trip.vehicle?.vehicleType?.name})</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <i className="ti ti-users text-amber-500 mt-0.5" />
                    <div>
                      <span className="text-xs text-gray-500 block">Nhân viên đi cùng</span>
                      <span className="font-semibold">
                        {trip.tripStaffs?.length 
                          ? trip.tripStaffs.map(ts => `${ts.staff.user.fullName}`).join(', ')
                          : 'Chưa có thông tin'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {tripStatus && <Badge variant="primary" className="mt-3">Trạng thái mới: {tripStatus}</Badge>}
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            {STATUS_ACTIONS.map(action => {
              const isPrimary = action.value === 'COMPLETED';
              const isDanger = action.value === 'CANCELLED';
              return (
                <Button
                  key={action.value}
                  disabled={updating}
                  onClick={() => handleUpdateStatus(action.value)}
                  variant={isPrimary ? 'primary' : isDanger ? 'danger' : 'outline'}
                  size="sm"
                >
                  {action.label}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-gray-100 dark:border-slate-800">
          <div className="mb-2 flex justify-between text-xs font-bold text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1.5"><i className="ti ti-chart-pie" /> Tiến độ lên xe</span>
            <span className={progress === 100 ? 'text-green-500' : 'text-[#e85d04]'}>{progress}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800 shadow-inner">
            <div 
              className={`h-full rounded-full transition-all duration-500 ease-out ${progress === 100 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-[#e85d04] shadow-[0_0_10px_rgba(232,93,4,0.5)]'}`} 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>
      </Card>

      {error && <Card className="border-red-200 bg-red-50 text-red-700">{error}</Card>}

      {loading ? (
        <Loading />
      ) : seats.length === 0 ? (
        <EmptyState title="Chưa có sơ đồ ghế" description="Chuyến này chưa có dữ liệu chỗ ngồi." icon="ti-armchair" />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-xs shadow-sm">
              {[
                { cls: 'border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-900/20', label: 'Có khách, chờ xác nhận' },
                { cls: 'border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-900/20', label: 'Đã lên xe' },
                { cls: 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800', label: 'Ghế trống' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className={`h-4 w-4 rounded border ${item.cls}`} />
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{item.label}</span>
                </div>
              ))}
            </div>
            {floors.map(renderFloor)}
          </div>

          <aside className="space-y-4">
            <Card className="sticky top-6 shadow-sm p-5">
              <div className="mb-5 flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                <h2 className="font-bold text-gray-800 dark:text-white text-lg flex items-center gap-2">
                  <i className="ti ti-users text-gray-400" />
                  Hành khách
                </h2>
                <Badge variant="default">{passengers.length}</Badge>
              </div>
              
              {passengers.length === 0 ? (
                <div className="rounded-xl bg-gray-50 dark:bg-slate-800/50 p-6 text-center text-sm font-medium text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-slate-700">
                  <i className="ti ti-user-x text-2xl mb-2 block opacity-50" />
                  Danh sách sẽ xuất hiện khi khách thanh toán vé.
                </div>
              ) : (
                <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-1 custom-scrollbar">
                  {passengers.map((passenger) => {
                    const badge = TICKET_BADGES[passenger.status] || TICKET_BADGES.PAID;
                    const checked = isCheckedIn(passenger);
                    const seatCode = passenger.tripSeat?.seatLayout?.seatCode || seats.find(seat => seat.id === passenger.tripSeatId)?.seatLayout?.seatCode;
                    return (
                      <div key={passenger.id} className={`rounded-xl border p-4 transition-all ${checked ? 'border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#e85d04]/30'}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-bold text-gray-900 dark:text-white text-sm">{passenger.passengerName}</p>
                            <p className="mt-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                              <span className="bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">Ghế {seatCode || '-'}</span> 
                              <span>{passenger.passengerPhone || '-'}</span>
                            </p>
                          </div>
                          <Badge variant={badge.cls} className="shrink-0 text-[10px] px-2 py-0.5">
                            {checked ? 'Đã lên xe' : badge.label}
                          </Badge>
                        </div>
                        {!checked && (
                          <Button
                            onClick={() => handleCheckIn(passenger)}
                            disabled={checkingTicketId === passenger.id}
                            fullWidth
                            variant="primary"
                            className="mt-3 !py-1.5 text-xs"
                          >
                            {checkingTicketId === passenger.id ? 'Đang xác nhận...' : 'Xác nhận lên xe'}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
