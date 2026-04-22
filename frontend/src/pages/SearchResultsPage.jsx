import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { searchTrips } from '../store/slices/tripSlice';
import { setSelectedTrip } from '../store/slices/bookingSlice';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const statusBadge = {
  SCHEDULED: { label: 'Còn chỗ', cls: 'bg-green-100 text-green-700' },
  BOARDING: { label: 'Đang lên xe', cls: 'bg-blue-100 text-blue-700' },
};

export default function SearchResultsPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { results, loading, error } = useSelector(s => s.trip);

  const origin = params.get('origin');
  const destination = params.get('destination');
  const date = params.get('date');

  useEffect(() => {
    if (origin && destination && date) {
      dispatch(searchTrips({ origin, destination, date }));
    }
  }, [origin, destination, date]);

  const handleSelect = (trip) => {
    dispatch(setSelectedTrip(trip));
    navigate(`/trips/${trip.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {origin} → {destination}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {date && format(new Date(date), 'EEEE, dd/MM/yyyy', { locale: vi })}
        </p>
      </div>

      {loading && (
        <div className="text-center py-16 text-gray-500">
          <div className="text-4xl mb-3 animate-bounce">🚌</div>
          <p>Đang tìm kiếm chuyến xe...</p>
        </div>
      )}

      {error && (
        <div className="card border-red-200 bg-red-50 text-red-700 text-center py-8">
          {error}
        </div>
      )}

      {!loading && results.length === 0 && !error && (
        <div className="card text-center py-16 text-gray-500">
          <div className="text-5xl mb-3">😔</div>
          <p className="font-semibold">Không tìm thấy chuyến xe</p>
          <p className="text-sm mt-1">Vui lòng thử lại với ngày khác hoặc tuyến đường khác.</p>
        </div>
      )}

      <div className="space-y-4">
        {results.map(trip => {
          const available = trip._count?.tripSeats ?? '?';
          const badge = statusBadge[trip.status] || { label: trip.status, cls: 'bg-gray-100 text-gray-600' };
          return (
            <div key={trip.id} className="card hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Operator info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800">
                      {trip.route?.operator?.companyName}
                    </span>
                    <span className={`badge ${badge.cls}`}>{badge.label}</span>
                  </div>
                  <div className="text-sm text-gray-500">{trip.vehicle?.vehicleType?.name}</div>
                </div>

                {/* Times */}
                <div className="flex items-center gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-gray-800">
                      {format(new Date(trip.departureTime), 'HH:mm')}
                    </div>
                    <div className="text-xs text-gray-400">{trip.route?.originCity}</div>
                  </div>
                  <div className="text-gray-300 text-2xl">→</div>
                  <div>
                    <div className="text-xl font-bold text-gray-800">
                      {format(new Date(trip.estimatedArrival), 'HH:mm')}
                    </div>
                    <div className="text-xs text-gray-400">{trip.route?.destinationCity}</div>
                  </div>
                </div>

                {/* Price & action */}
                <div className="flex flex-col items-end gap-2 min-w-[120px]">
                  <div className="text-xl font-bold text-brand">
                    {Number(trip.basePrice).toLocaleString('vi-VN')}đ
                  </div>
                  <div className="text-xs text-gray-400">{available} chỗ trống</div>
                  <button onClick={() => handleSelect(trip)} className="btn-primary text-sm py-2 px-4">
                    Chọn ghế
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
