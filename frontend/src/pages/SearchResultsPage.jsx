import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearResults, searchTrips } from '../store/slices/tripSlice';
import { setSelectedTrip } from '../store/slices/bookingSlice';
import { format, addDays, isValid, parseISO, subDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { findCity, normalizeText } from '../constants/travel';
import { AlertTriangle, Bus, SearchX, Calendar, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

const statusBadge = {
  SCHEDULED: { label: 'Còn chỗ', cls: 'bg-green-100 text-green-700' },
  BOARDING: { label: 'Đang lên xe', cls: 'bg-blue-100 text-blue-700' },
};

export default function SearchResultsPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { results, loading, error } = useSelector(s => s.trip);

  const [selectedOperator, setSelectedOperator] = useState('ALL');

  const origin = params.get('origin');
  const destination = params.get('destination');
  const date = params.get('date');
  const validOrigin = findCity(origin);
  const validDestination = findCity(destination);
  const parsedDate = date ? parseISO(date) : null;
  const hasValidDate = parsedDate ? isValid(parsedDate) : false;
  const hasSameCity = Boolean(validOrigin && validDestination && normalizeText(validOrigin) === normalizeText(validDestination));
  const hasInvalidSearch = !validOrigin || !validDestination || !hasValidDate || hasSameCity;

  useEffect(() => {
    if (hasInvalidSearch) {
      if (!origin && !destination && !date) {
        navigate('/', { replace: true });
        return;
      }
      dispatch(clearResults());
      return;
    }

    if (validOrigin !== origin || validDestination !== destination) {
      navigate(`/search?origin=${encodeURIComponent(validOrigin)}&destination=${encodeURIComponent(validDestination)}&date=${date}`, { replace: true });
      return;
    }

    dispatch(searchTrips({ origin: validOrigin, destination: validDestination, date }));
    setSelectedOperator('ALL');
  }, [origin, destination, date, validOrigin, validDestination, hasInvalidSearch, navigate, dispatch]);

  const operators = useMemo(() => {
    if (!results) return [];
    const ops = new Set();
    results.forEach(trip => {
      if (trip.route?.operator?.companyName) {
        ops.add(trip.route.operator.companyName);
      }
    });
    return Array.from(ops).sort();
  }, [results]);

  const filteredResults = useMemo(() => {
    if (selectedOperator === 'ALL') return results;
    return results.filter(trip => trip.route?.operator?.companyName === selectedOperator);
  }, [results, selectedOperator]);

  const handleSelect = (trip) => {
    dispatch(setSelectedTrip(trip));
    navigate(`/trips/${trip.id}`);
  };

  const handleDateChange = (days) => {
    if (hasInvalidSearch) return;
    const newDate = days > 0 ? addDays(parsedDate, days) : subDays(parsedDate, Math.abs(days));
    const formattedDate = format(newDate, 'yyyy-MM-dd');
    navigate(`/search?origin=${encodeURIComponent(validOrigin)}&destination=${encodeURIComponent(validDestination)}&date=${formattedDate}`);
  };

  const isPrevDisabled = () => {
    if (hasInvalidSearch) return true;
    const searchDate = new Date(parsedDate);
    searchDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return searchDate <= today;
  };

  if (hasInvalidSearch) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="card border-orange-100 bg-orange-50 text-center py-12">
          <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-gray-800">Thông tin tìm kiếm chưa hợp lệ</h1>
          <p className="mt-3 text-gray-600">
            {hasSameCity
              ? 'Điểm đi và điểm đến phải là hai thành phố khác nhau.'
              : 'Vui lòng quay lại trang chủ và chọn điểm đi, điểm đến từ danh sách thành phố gợi ý.'}
          </p>
          <button onClick={() => navigate('/')} className="btn-primary mt-8 px-8">
            Tìm lại chuyến xe
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-10 text-center">
        <h1 className="text-3xl md:text-4xl font-black text-gray-800 flex items-center justify-center gap-4">
          <span>{validOrigin}</span>
          <ArrowRight className="w-8 h-8 md:w-10 md:h-10 text-brand" strokeWidth={3} />
          <span>{validDestination}</span>
        </h1>
        
        <div className="mt-5 flex items-center justify-center gap-4">
          <button 
            onClick={() => handleDateChange(-1)} 
            disabled={isPrevDisabled()}
            className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-600 hover:text-brand hover:border-brand transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-100 disabled:hover:text-gray-600"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="text-brand font-medium text-lg bg-white px-8 py-2.5 rounded-full shadow-sm border border-gray-100 flex items-center gap-2 min-w-[220px] justify-center">
            <Calendar className="w-5 h-5 mr-1" />
            {format(parsedDate, 'EEEE, dd/MM/yyyy', { locale: vi })}
          </div>

          <button 
            onClick={() => handleDateChange(1)} 
            className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-600 hover:text-brand hover:border-brand transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-16 text-gray-500">
          <Bus className="w-10 h-10 text-gray-400 mx-auto mb-3 animate-pulse" />
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
          <SearchX className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-lg">Không tìm thấy chuyến xe</p>
          <p className="text-sm mt-1">Vui lòng thử lại với ngày khác hoặc tuyến đường khác.</p>
        </div>
      )}

      {!loading && results.length > 0 && operators.length > 1 && (
        <div className="mb-6 flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <span className="text-gray-500 font-medium whitespace-nowrap">Lọc nhà xe:</span>
          <button
            onClick={() => setSelectedOperator('ALL')}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
              selectedOperator === 'ALL'
                ? 'bg-brand text-white shadow-md shadow-brand/30'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Tất cả
          </button>
          {operators.map(op => (
            <button
              key={op}
              onClick={() => setSelectedOperator(op)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                selectedOperator === op
                  ? 'bg-brand text-white shadow-md shadow-brand/30'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {op}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-6">
        {filteredResults.map(trip => {
          const available = trip._count?.tripSeats ?? '?';
          const badge = statusBadge[trip.status] || { label: trip.status, cls: 'bg-gray-100 text-gray-600' };
          return (
            <div key={trip.id} className="relative bg-white rounded-2xl shadow-sm hover:shadow-xl hover:shadow-gray-200/60 transition-all duration-300 flex flex-col md:flex-row overflow-hidden border border-gray-100 group">
              
              {/* Ticket cutouts */}
              <div className="hidden md:block absolute top-1/2 -left-3 w-6 h-6 bg-gray-50 rounded-full transform -translate-y-1/2 border-r border-gray-100"></div>
              <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-6 bg-gray-50 rounded-full transform -translate-y-1/2 border-l border-gray-100"></div>
              
              {/* Main Info */}
              <div className="flex-1 p-6 md:p-8 md:border-r-2 md:border-dashed md:border-gray-200 relative">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-black text-xl text-gray-800 group-hover:text-brand transition-colors">
                      {trip.route?.operator?.companyName}
                    </h3>
                    <p className="text-gray-500 font-medium flex items-center gap-1.5 mt-1">
                      <Bus className="w-4 h-4 text-gray-400" /> {trip.vehicle?.vehicleType?.name}
                    </p>
                  </div>
                  <span className={`badge ${badge.cls} shadow-sm`}>{badge.label}</span>
                </div>

                {/* Timeline */}
                <div className="flex items-center justify-between relative">
                  <div className="text-center z-10 bg-white pr-4">
                      <div className="text-3xl font-black text-gray-800">
                        {format(new Date(trip.departureTime), 'HH:mm')}
                      </div>
                      <div className="text-xs text-brand mt-1 font-bold">
                        {format(new Date(trip.departureTime), 'dd/MM/yyyy')}
                      </div>
                      <div className="font-semibold text-gray-500 mt-1">{trip.route?.originCity}</div>
                    </div>
                    
                    {/* Decorative line */}
                    <div className="flex-1 flex items-center justify-center relative">
                      <div className="w-full border-t-2 border-dashed border-gray-300 absolute top-1/2"></div>
                      <div className="w-4 h-4 rounded-full bg-brand/20 z-10 border-2 border-brand animate-pulse"></div>
                    </div>
                    
                    <div className="text-center z-10 bg-white pl-4">
                      <div className="text-3xl font-black text-gray-800">
                        {format(new Date(trip.estimatedArrival), 'HH:mm')}
                      </div>
                      <div className="text-xs text-brand mt-1 font-bold">
                        {format(new Date(trip.estimatedArrival), 'dd/MM/yyyy')}
                      </div>
                      <div className="font-semibold text-gray-500 mt-1">{trip.route?.destinationCity}</div>
                  </div>
                </div>
              </div>

              {/* Price & Action */}
              <div className="bg-gray-50/50 p-6 md:p-8 flex flex-col items-center justify-center min-w-[240px]">
                <div className="text-brand font-black text-3xl mb-1">
                  {Number(trip.basePrice).toLocaleString('vi-VN')}đ
                </div>
                <div className="text-gray-500 font-medium mb-6 px-3 py-1 bg-white rounded-full text-sm border border-gray-200">
                  {available} chỗ trống
                </div>
                <button onClick={() => handleSelect(trip)} className="btn-primary w-full shadow-md shadow-brand/30">
                  Chọn ghế ngay
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
