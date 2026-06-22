import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedTrip } from '../store/slices/bookingSlice';
import { tripAPI, reviewAPI } from '../services/api';
import { format, differenceInMinutes } from 'date-fns';
import { vi } from 'date-fns/locale';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusConfig = {
  SCHEDULED:  { label: 'Còn chỗ',      cls: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
  BOARDING:   { label: 'Đang lên xe',   cls: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500'  },
  DEPARTED:   { label: 'Đã khởi hành', cls: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  DELAYED:    { label: 'Bị trễ',        cls: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  CANCELLED:  { label: 'Đã hủy',        cls: 'bg-red-100 text-red-700',      dot: 'bg-red-500'  },
  COMPLETED:  { label: 'Hoàn thành',   cls: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400' },
};

const fmtDuration = (mins) => {
  if (!mins) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}g${m > 0 ? ` ${m}p` : ''}` : `${m}p`;
};

const StarRating = ({ value }) => (
  <span className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <svg key={i} className={`w-3.5 h-3.5 ${i <= value ? 'text-amber-400' : 'text-gray-200'}`}
        fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </span>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TripDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);

  const [trip, setTrip]       = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setLoading(true);
    tripAPI.getById(id)
      .then(r => {
        const t = r.data.data;
        setTrip(t);
        dispatch(setSelectedTrip(t));
        // fetch reviews for this operator
        if (t.route?.operator?.id) {
          reviewAPI.getByOperator(t.route.operator.id)
            .then(rv => setReviews(rv.data.data || []))
            .catch(() => {});
        }
      })
      .catch(() => setError('Không tìm thấy chuyến xe hoặc chuyến đã hết hạn.'))
      .finally(() => setLoading(false));
  }, [id, dispatch]);

  const handleBook = () => {
    if (!user) { navigate('/login'); return; }
    navigate(`/booking/${id}`);
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-gray-400">
      <div className="text-5xl animate-bounce">🚌</div>
      <p className="font-medium">Đang tải thông tin chuyến xe...</p>
    </div>
  );

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-4">😔</div>
      <h1 className="text-2xl font-black text-gray-800 mb-2">Không tìm thấy chuyến</h1>
      <p className="text-gray-500 mb-8">{error}</p>
      <button onClick={() => navigate(-1)} className="btn-outline">← Quay lại</button>
    </div>
  );

  // ── Derived data ─────────────────────────────────────────────────────────
  const status     = statusConfig[trip.status] || statusConfig.SCHEDULED;
  const operator   = trip.route?.operator;
  const vehicle    = trip.vehicle;
  const vType      = vehicle?.vehicleType;
  const route      = trip.route;
  const departure  = new Date(trip.departureTime);
  const arrival    = new Date(trip.estimatedArrival);
  const durationMins = differenceInMinutes(arrival, departure);
  const totalSeats   = trip.tripSeats?.length ?? 0;
  const availSeats   = trip.tripSeats?.filter(s => s.status === 'AVAILABLE').length ?? 0;
  const canBook      = ['SCHEDULED', 'BOARDING'].includes(trip.status) && availSeats > 0;

  // Seat stats by status
  const seatStats = trip.tripSeats?.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {}) ?? {};

  // Reviews
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  // Staff
  const drivers    = trip.tripStaffs?.filter(s => s.staff?.role === 'DRIVER') ?? [];
  const assistants = trip.tripStaffs?.filter(s => s.staff?.role === 'ASSISTANT') ?? [];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 page-enter">

      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-2 text-sm text-gray-400">
        <button onClick={() => navigate('/')} className="hover:text-brand transition-colors">Trang chủ</button>
        <span>›</span>
        <button onClick={() => navigate(-1)} className="hover:text-brand transition-colors">
          {route?.originCity} → {route?.destinationCity}
        </button>
        <span>›</span>
        <span className="text-gray-600 font-medium">Chi tiết chuyến</span>
      </nav>

      {/* ── Hero card ── */}
      <div className="relative bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-orange-400 via-brand to-orange-600" />

        <div className="p-6 md:p-8">
          {/* Operator header */}
          <div className="flex items-start justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              {operator?.logoUrl && !imgError ? (
                <img
                  src={operator.logoUrl}
                  alt={operator.companyName}
                  onError={() => setImgError(true)}
                  className="w-14 h-14 rounded-2xl object-cover shadow-sm border border-gray-100"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-2xl shadow-sm">
                  🚌
                </div>
              )}
              <div>
                <h1 className="text-xl font-black text-gray-800">{operator?.companyName}</h1>
                <p className="text-gray-500 text-sm font-medium flex items-center gap-1.5 mt-0.5">
                  <span>🚐</span> {vType?.name}
                  {operator?.hotline && (
                    <span className="ml-3">📞 <a href={`tel:${operator.hotline}`} className="text-brand hover:underline">{operator.hotline}</a></span>
                  )}
                </p>
                {avgRating && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <StarRating value={Math.round(Number(avgRating))} />
                    <span className="text-xs font-semibold text-amber-500">{avgRating}</span>
                    <span className="text-xs text-gray-400">({reviews.length} đánh giá)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span className={`badge ${status.cls} flex items-center gap-1.5`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
              <span className="text-xs text-gray-400">#{id.slice(0, 8).toUpperCase()}</span>
            </div>
          </div>

          {/* Timeline */}
          <div className="flex items-center gap-4 py-6 border-y border-dashed border-gray-200">
            {/* Departure */}
            <div className="flex-1 text-center">
              <div className="text-4xl font-black text-gray-800">
                {format(departure, 'HH:mm')}
              </div>
              <div className="font-bold text-gray-700 mt-1">{route?.originCity}</div>
              <div className="text-xs text-gray-400 mt-0.5">
                {format(departure, 'EEEE, dd/MM/yyyy', { locale: vi })}
              </div>
              <div className="text-xs text-gray-500 mt-1 line-clamp-1">{route?.originAddress}</div>
            </div>

            {/* Duration */}
            <div className="flex flex-col items-center gap-1 min-w-[100px]">
              <div className="text-xs text-gray-400 font-medium">{fmtDuration(durationMins)}</div>
              <div className="relative w-full flex items-center">
                <div className="flex-1 h-px bg-gradient-to-r from-brand/40 via-brand to-brand/40" />
                <span className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-brand shadow-md shadow-brand/40 border-2 border-white" />
              </div>
              <div className="text-xs text-gray-400">đi thẳng</div>
            </div>

            {/* Arrival */}
            <div className="flex-1 text-center">
              <div className="text-4xl font-black text-gray-800">
                {format(arrival, 'HH:mm')}
              </div>
              <div className="font-bold text-gray-700 mt-1">{route?.destinationCity}</div>
              <div className="text-xs text-gray-400 mt-0.5">
                {format(arrival, 'EEEE, dd/MM/yyyy', { locale: vi })}
              </div>
              <div className="text-xs text-gray-500 mt-1 line-clamp-1">{route?.destinationAddress}</div>
            </div>
          </div>

          {/* Price + CTA */}
          <div className="flex items-center justify-between mt-6">
            <div>
              <div className="text-3xl font-black text-brand">
                {Number(trip.basePrice).toLocaleString('vi-VN')}
                <span className="text-base font-semibold text-gray-400 ml-1">đ/ghế</span>
              </div>
              <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${availSeats > 5 ? 'bg-green-400' : availSeats > 0 ? 'bg-yellow-400' : 'bg-red-400'}`} />
                {availSeats > 0
                  ? <><strong className="text-gray-700">{availSeats}</strong> / {totalSeats} chỗ trống</>
                  : <span className="text-red-500 font-semibold">Hết chỗ</span>
                }
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => navigate(-1)} className="btn-outline px-6">
                ← Quay lại
              </button>
              <button
                onClick={handleBook}
                disabled={!canBook}
                className="btn-primary px-8 shadow-lg shadow-brand/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {!canBook
                  ? (availSeats === 0 ? 'Hết chỗ' : 'Không nhận đặt')
                  : 'Chọn ghế ngay →'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Info grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Seat availability */}
        <div className="card">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-brand/10 text-brand flex items-center justify-center text-sm">💺</span>
            Tình trạng ghế
          </h2>
          <div className="space-y-2.5">
            {[
              { label: 'Còn trống',    key: 'AVAILABLE',   color: 'bg-green-400',  textColor: 'text-green-700' },
              { label: 'Đang giữ',     key: 'PROCESSING',  color: 'bg-yellow-400', textColor: 'text-yellow-700' },
              { label: 'Đã đặt',       key: 'BOOKED',      color: 'bg-red-400',    textColor: 'text-red-700' },
              { label: 'Không khả dụng', key: 'UNAVAILABLE', color: 'bg-gray-300', textColor: 'text-gray-500' },
            ].map(({ label, key, color, textColor }) => (
              seatStats[key] > 0 && (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                    <span className="text-sm text-gray-600">{label}</span>
                  </div>
                  <span className={`text-sm font-bold ${textColor}`}>{seatStats[key]}</span>
                </div>
              )
            ))}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-500">Tổng ghế</span>
              <span className="text-sm font-bold text-gray-700">{totalSeats}</span>
            </div>
          </div>

          {/* Mini seat progress bar */}
          <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden flex">
            {totalSeats > 0 && <>
              <div className="bg-green-400 transition-all" style={{ width: `${(seatStats.AVAILABLE || 0) / totalSeats * 100}%` }} />
              <div className="bg-yellow-400 transition-all" style={{ width: `${(seatStats.PROCESSING || 0) / totalSeats * 100}%` }} />
              <div className="bg-red-400 transition-all"   style={{ width: `${(seatStats.BOOKED || 0) / totalSeats * 100}%` }} />
            </>}
          </div>
        </div>

        {/* Vehicle info */}
        <div className="card">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-brand/10 text-brand flex items-center justify-center text-sm">🚐</span>
            Thông tin xe
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Loại xe',       value: vType?.name },
              { label: 'Số ghế',        value: vType?.seatCount ? `${vType.seatCount} ghế` : null },
              { label: 'Biển số',       value: vehicle?.licensePlate },
              { label: 'Năm SX',        value: vehicle?.manufactureYear },
              { label: 'Khoảng cách',   value: route?.distanceKm ? `~${route.distanceKm} km` : null },
              { label: 'Thời gian',     value: fmtDuration(route?.durationMinutes) },
            ].filter(i => i.value).map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="font-semibold text-gray-700">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Staff */}
        <div className="card">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-brand/10 text-brand flex items-center justify-center text-sm">👤</span>
            Tổ lái xe
          </h2>
          {trip.tripStaffs?.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Chưa phân công</p>
          ) : (
            <div className="space-y-3">
              {drivers.map((ts, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm">🧑‍✈️</div>
                  <div>
                    <div className="text-sm font-semibold text-gray-700">{ts.staff?.fullName}</div>
                    <div className="text-xs text-blue-500">Tài xế</div>
                  </div>
                </div>
              ))}
              {assistants.map((ts, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm">🧑</div>
                  <div>
                    <div className="text-sm font-semibold text-gray-700">{ts.staff?.fullName}</div>
                    <div className="text-xs text-green-500">Phụ xe</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cancellation policy reminder */}
          <div className="mt-4 pt-3 border-t border-dashed border-gray-100">
            <p className="text-xs text-gray-400 leading-relaxed">
              ℹ️ Hủy vé trước <strong>3 ngày</strong> được hoàn <strong>90%</strong> giá vé.
            </p>
          </div>
        </div>
      </div>

      {/* ── Reviews ── */}
      {reviews.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center text-sm">⭐</span>
              Đánh giá nhà xe
              <span className="ml-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{reviews.length}</span>
            </h2>
            {avgRating && (
              <div className="flex items-center gap-2">
                <StarRating value={Math.round(Number(avgRating))} />
                <span className="font-black text-amber-500 text-lg">{avgRating}</span>
                <span className="text-sm text-gray-400">/ 5</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {reviews.slice(0, 5).map((rv, i) => (
              <div key={i} className="flex gap-3 p-4 bg-gray-50/60 rounded-xl">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-200 to-orange-300 flex items-center justify-center text-sm font-bold text-brand flex-shrink-0">
                  {rv.customer?.fullName?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-700">{rv.customer?.fullName || 'Khách hàng'}</span>
                    <StarRating value={rv.rating} />
                    <span className="text-xs text-gray-400 ml-auto">{format(new Date(rv.createdAt), 'dd/MM/yyyy')}</span>
                  </div>
                  {rv.comment && (
                    <p className="text-sm text-gray-600 leading-relaxed">{rv.comment}</p>
                  )}
                </div>
              </div>
            ))}
            {reviews.length > 5 && (
              <p className="text-center text-sm text-gray-400">
                và {reviews.length - 5} đánh giá khác...
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── CTA sticky bottom (mobile) ── */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-gray-100 shadow-2xl p-4 flex items-center justify-between z-40">
        <div>
          <div className="text-xl font-black text-brand">{Number(trip.basePrice).toLocaleString('vi-VN')}đ</div>
          <div className="text-xs text-gray-500">{availSeats} chỗ trống</div>
        </div>
        <button
          onClick={handleBook}
          disabled={!canBook}
          className="btn-primary px-8 py-3 shadow-lg shadow-brand/30 disabled:opacity-50"
        >
          {canBook ? 'Chọn ghế ngay →' : 'Hết chỗ'}
        </button>
      </div>

      {/* Bottom padding for mobile CTA */}
      <div className="h-24 md:h-0" />
    </div>
  );
}
