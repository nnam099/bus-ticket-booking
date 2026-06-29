import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedTrip, setLockExpiry, setStep, resetBooking } from '../../store/slices/bookingSlice';
import { tripAPI, bookingAPI, userAPI } from '../../services/api';
import SeatMap from '../../components/customer/SeatMap';
import BookingTimer from '../../components/customer/BookingTimer';
import { format } from 'date-fns';
import { Hourglass, CreditCard } from 'lucide-react';

const VIETNAM_PHONE_REGEX = /^0\d{9}$/;

export default function BookingPage() {
  const params = useParams();
  const tripId = params.tripId || params.id;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { selectedSeats, step, lockExpiresAt, selectedTrip } = useSelector(s => s.booking);

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locking, setLocking] = useState(false);
  const [error, setError] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [pendingOrder, setPendingOrder] = useState(null);

  useEffect(() => {
    dispatch(resetBooking());

    // Tải thông tin chuyến, kiểm tra đơn hàng PENDING và ghế đang giữ
    Promise.all([
      tripAPI.getById(tripId),
      userAPI.getMyTickets().catch(() => ({ data: { data: [] } })),
      userAPI.getMyLockedSeats().catch(() => ({ data: { data: [] } }))
    ]).then(([tripRes, ticketsRes, lockedRes]) => {
      const tripData = tripRes.data.data;
      setTrip(tripData);
      dispatch(setSelectedTrip(tripData));

      // Kiểm tra xem user đã có vé PENDING cho chuyến này chưa
      const tickets = ticketsRes.data.data || [];
      const pendingTicket = tickets.find(
        t => t.status === 'PENDING' && t.tripSeat?.trip?.id === tripId
      );
      if (pendingTicket && pendingTicket.order?.id) {
        setPendingOrder(pendingTicket.order);
      }

      // Khôi phục ghế đang giữ nếu có
      const lockedSeats = lockedRes.data.data || [];
      const myLockedSeats = lockedSeats.filter(s => s.tripId === tripId);
      if (myLockedSeats.length > 0) {
        myLockedSeats.forEach(seat => {
          dispatch({ 
            type: 'booking/toggleSeat', 
            payload: { id: seat.id, seatCode: seat.seatLayout.seatCode, price: tripData.basePrice } 
          });
        });
        dispatch(setLockExpiry(myLockedSeats[0].lockExpiresAt));
        dispatch(setStep(2));
      }

    }).catch(() => setError('Không tìm thấy chuyến xe.'))
      .finally(() => setLoading(false));
  }, [tripId, dispatch]);

  useEffect(() => {
    setPassengers(selectedSeats.map((s, i) => ({ name: '', phone: '', seatId: s.id })));
  }, [selectedSeats.length]);

  const handleLockSeats = async () => {
    if (!selectedSeats.length) return;
    setLocking(true);
    try {
      const res = await bookingAPI.lockSeats({ tripId, seatIds: selectedSeats.map(s => s.id) });
      dispatch(setLockExpiry(res.data.data.lockExpiresAt));
      dispatch(setStep(2));
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể giữ chỗ. Vui lòng thử lại.');
    } finally {
      setLocking(false);
    }
  };

  const handleConfirm = () => {
    const normalizedPassengers = passengers.map((p) => ({ ...p, name: p.name.trim(), phone: p.phone.trim() }));
    if (normalizedPassengers.some(p => !p.name)) {
      setError('Vui lòng nhập đầy đủ tên hành khách.');
      return;
    }
    if (normalizedPassengers.some(p => !VIETNAM_PHONE_REGEX.test(p.phone))) {
      setError('Số điện thoại hành khách phải gồm 10 chữ số và bắt đầu bằng số 0.');
      return;
    }
    navigate('/payment', { state: { tripId, passengers: normalizedPassengers } });
  };

  if (loading) return <div className="text-center py-20 text-gray-500 text-lg">Đang tải...</div>;
  if (error && !trip) return <div className="card border-red-200 bg-red-50 text-red-700 text-center py-8">{error}</div>;

  // Nếu user đã có đơn PENDING cho chuyến này, hiển thị banner gợi ý tiếp tục
  if (pendingOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="card border-yellow-200 bg-yellow-50 text-center py-10 space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-600 shadow-sm">
            <Hourglass className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Bạn đang có đơn đặt chỗ chưa thanh toán</h1>
            <p className="mt-2 text-sm text-gray-600">
              Ghế cho chuyến <strong>{trip?.route?.originCity} → {trip?.route?.destinationCity}</strong> đã được giữ.
              Vui lòng hoàn tất thanh toán để xác nhận chỗ ngồi của bạn.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={`/my-tickets/order/${pendingOrder.id}/pay`}
              className="btn-primary px-8 py-3 text-base flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" /> Tiếp tục thanh toán
            </Link>
            <Link to="/my-tickets" className="btn-outline px-8 py-3 text-base">
              Xem vé của tôi
            </Link>
          </div>
          <p className="text-xs text-gray-400">
            Nếu bạn muốn đặt lại từ đầu, hãy vào "Vé của tôi" và hủy đơn cũ trước.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {trip?.route?.originCity} → {trip?.route?.destinationCity}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {trip && format(new Date(trip.departureTime), 'HH:mm — dd/MM/yyyy')} •{' '}
          {trip?.route?.operator?.companyName} • {trip?.vehicle?.vehicleType?.name}
        </p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-8 text-sm">
        {['Chọn ghế', 'Thông tin', 'Thanh toán'].map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
              ${step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-brand text-white' : 'bg-gray-200 text-gray-500'}`}>
              {step > i + 1 ? '✓' : i + 1}
            </span>
            <span className={step === i + 1 ? 'text-brand font-semibold' : 'text-gray-500'}>{s}</span>
            {i < 2 && <span className="text-gray-300">›</span>}
          </div>
        ))}
      </div>

      {/* Timer if locked */}
      {lockExpiresAt && (
        <BookingTimer
          expiresAt={lockExpiresAt}
          tripId={tripId}
          seatIds={selectedSeats.map(seat => seat.id)}
          redirectTo={`/booking/${tripId}`}
        />
      )}

      {error && <div className="card border-red-200 bg-red-50 text-red-700 mb-4 text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Seat map */}
        <div className="md:col-span-2">
          {step === 1 && (
            <div className="card">
              <h2 className="font-semibold text-gray-800 mb-4">Chọn ghế</h2>
              {trip && <SeatMap tripSeats={trip.tripSeats} tripId={tripId} />}
            </div>
          )}

          {step === 2 && (
            <div className="card">
              <h2 className="font-semibold text-gray-800 mb-4">Thông tin hành khách</h2>
              {passengers.map((p, i) => (
                <div key={i} className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold text-brand mb-2">
                    Ghế {selectedSeats[i]?.seatCode}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Họ tên *</label>
                      <input className="input" placeholder="Nguyễn Văn A"
                        value={p.name}
                        onChange={e => {
                          const copy = [...passengers];
                          copy[i] = { ...copy[i], name: e.target.value };
                          setPassengers(copy);
                        }} />
                    </div>
                    <div>
                      <label className="label">Số điện thoại *</label>
                      <input
                        className={`input ${p.phone && !VIETNAM_PHONE_REGEX.test(p.phone.trim()) ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}`}
                        placeholder="0901234567"
                        inputMode="numeric"
                        maxLength={10}
                        pattern="0[0-9]{9}"
                        value={p.phone}
                        onChange={e => {
                          const copy = [...passengers];
                          copy[i] = { ...copy[i], phone: e.target.value.replace(/\D/g, '').slice(0, 10) };
                          setPassengers(copy);
                        }} />
                      {p.phone && !VIETNAM_PHONE_REGEX.test(p.phone.trim()) && (
                        <p className="mt-1 text-xs font-medium text-red-500">
                          Số điện thoại phải có 10 chữ số và bắt đầu bằng 0.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-3">Ghế đã chọn</h3>
            {selectedSeats.length === 0 ? (
              <p className="text-sm text-gray-400">Chưa chọn ghế nào</p>
            ) : (
              <div className="space-y-2">
                {selectedSeats.map(s => (
                  <div key={s.id} className="flex justify-between text-sm">
                    <span className="font-medium">Ghế {s.seatCode}</span>
                    <span className="text-brand font-semibold">
                      {Number(trip?.basePrice || 0).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-2 flex justify-between font-bold">
                  <span>Tổng cộng</span>
                  <span className="text-brand">
                    {(selectedSeats.length * Number(trip?.basePrice || 0)).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>
            )}
          </div>

          {step === 1 && (
            <button onClick={handleLockSeats} disabled={!selectedSeats.length || locking}
              className="btn-primary w-full py-3">
              {locking ? 'Đang giữ chỗ...' : `Tiếp tục (${selectedSeats.length} ghế)`}
            </button>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <button onClick={handleConfirm} className="btn-primary w-full py-3">
                Tiếp tục thanh toán →
              </button>
              <button onClick={() => dispatch(setStep(1))} className="btn-outline w-full py-2 text-sm">
                ← Quay lại chọn ghế
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
