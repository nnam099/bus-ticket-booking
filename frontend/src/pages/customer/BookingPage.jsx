import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedTrip, setLockExpiry, setStep, resetBooking } from '../../store/slices/bookingSlice';
import { tripAPI, bookingAPI } from '../../services/api';
import SeatMap from '../../components/customer/SeatMap';
import BookingTimer from '../../components/customer/BookingTimer';
import { format } from 'date-fns';

export default function BookingPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { selectedSeats, step, lockExpiresAt, selectedTrip } = useSelector(s => s.booking);

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locking, setLocking] = useState(false);
  const [error, setError] = useState(null);
  const [passengers, setPassengers] = useState([]);

  useEffect(() => {
    tripAPI.getById(tripId)
      .then(r => { setTrip(r.data.data); dispatch(setSelectedTrip(r.data.data)); })
      .catch(() => setError('Không tìm thấy chuyến xe.'))
      .finally(() => setLoading(false));

    return () => { dispatch(resetBooking()); };
  }, [tripId]);

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
    if (passengers.some(p => !p.name)) {
      setError('Vui lòng nhập đầy đủ tên hành khách.');
      return;
    }
    navigate('/payment', { state: { tripId, passengers } });
  };

  if (loading) return <div className="text-center py-20 text-gray-500 text-lg">Đang tải...</div>;
  if (error && !trip) return <div className="card border-red-200 bg-red-50 text-red-700 text-center py-8">{error}</div>;

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
      {lockExpiresAt && <BookingTimer expiresAt={lockExpiresAt} />}

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
                      <label className="label">Số điện thoại</label>
                      <input className="input" placeholder="0901234567"
                        value={p.phone}
                        onChange={e => {
                          const copy = [...passengers];
                          copy[i] = { ...copy[i], phone: e.target.value };
                          setPassengers(copy);
                        }} />
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
