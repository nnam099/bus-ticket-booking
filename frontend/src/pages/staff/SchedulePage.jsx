import { useState, useEffect } from 'react';
import { staffAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export default function SchedulePage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    staffAPI.getAssignedTrips().then(res => {
      setTrips(res.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleAction = (actionName) => {
    alert(`Chức năng "${actionName}" đang được phát triển!`);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Lịch làm việc"
        description="Xem danh sách các chuyến xe được phân công và quản lý ca làm việc"
      />

      {loading ? (
        <div className="text-center py-12 text-gray-500">Đang tải lịch trình...</div>
      ) : trips.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
          Chưa có chuyến xe nào được phân công.
        </div>
      ) : (
        <div className="space-y-4">
          {trips.map(trip => {
            const isCompleted = new Date(trip.estimatedArrival) < new Date();
            const isOngoing = new Date(trip.departureTime) <= new Date() && new Date(trip.estimatedArrival) >= new Date();
            
            return (
              <Card key={trip.id} className={`hover:shadow-md transition-shadow ${isCompleted ? 'opacity-70' : ''}`} noPadding>
                <div className="p-5 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isCompleted ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' :
                        isOngoing ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {isCompleted ? 'Đã hoàn thành' : isOngoing ? 'Đang chạy' : 'Sắp tới'}
                      </span>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <i className="ti ti-calendar" />
                        {format(new Date(trip.departureTime), 'EEEE, dd/MM/yyyy', { locale: vi })}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          {trip.route.originCity} <i className="ti ti-arrow-right text-gray-400" /> {trip.route.destinationCity}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-4">
                          <span><i className="ti ti-clock" /> {format(new Date(trip.departureTime), 'HH:mm dd/MM/yyyy')} - {format(new Date(trip.estimatedArrival), 'HH:mm dd/MM/yyyy')}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                        <i className="ti ti-steering-wheel text-orange-500" />
                        <span>Biển số: <strong className="font-semibold">{trip.vehicle.licensePlate}</strong></span>
                      </div>
                      <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 hidden sm:block"></div>
                      <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                        <i className="ti ti-bus text-blue-500" />
                        <span>Loại xe: <strong className="font-semibold">{trip.vehicle.vehicleType.name}</strong></span>
                      </div>
                      <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 hidden sm:block"></div>
                      <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                        <i className="ti ti-users text-emerald-500" />
                        <span>Ghế đã bán: <strong className="font-semibold">{trip._count?.tripSeats || 0}/{trip.vehicle.vehicleType.seatCount}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto mt-4 md:mt-0">
                    <Link 
                      to={`/staff/trips/${trip.id}/check-in`}
                      className="flex-1 md:w-40 py-2 px-4 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium rounded-md shadow-sm transition-colors text-center flex items-center justify-center gap-2"
                    >
                      <i className="ti ti-ticket" /> Xem chi tiết
                    </Link>
                    {!isCompleted && !isOngoing && (
                      <>
                        <button 
                          onClick={() => handleAction('Xác nhận nhận ca')}
                          className="flex-1 md:w-40 py-2 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400 text-sm font-medium rounded-md transition-colors border border-emerald-200 dark:border-emerald-500/20 text-center"
                        >
                          Xác nhận nhận ca
                        </button>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleAction('Xin đổi ca')}
                            className="flex-1 py-1.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 dark:text-amber-400 text-xs font-medium rounded-md transition-colors border border-amber-200 dark:border-amber-500/20 text-center"
                          >
                            Đổi ca
                          </button>
                          <button 
                            onClick={() => handleAction('Xin nghỉ phép')}
                            className="flex-1 py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 text-xs font-medium rounded-md transition-colors border border-red-200 dark:border-red-500/20 text-center"
                          >
                            Nghỉ phép
                          </button>
                        </div>
                      </>
                    )}
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
