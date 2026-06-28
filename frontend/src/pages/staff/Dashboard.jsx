import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { staffAPI } from '../../services/api';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { PageHeader, Card, Button, EmptyState } from '../../components/ui';
import { useSelector } from 'react-redux';

export default function StaffDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector(s => s.auth);

  useEffect(() => {
    staffAPI.getDashboard()
      .then(r => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 animate-pulse">
        <div className="h-20 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-32 bg-gray-200 rounded-lg md:col-span-2" />
          <div className="h-32 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  const { stats, todayTrips, upcomingTrips, notifications } = data || {};
  const staffProfile = user?.staff || {};

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`Xin chào, ${staffProfile.fullName || user?.email || 'Nhân viên'}!`} 
        description="Tổng quan công việc và lịch trình của bạn hôm nay."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Schedule & Trips */}
        <div className="md:col-span-2 space-y-6">
          {/* Today's Schedule */}
          <Card>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="ti ti-calendar-event text-brand" /> Lịch làm việc hôm nay
            </h2>
            {todayTrips?.length > 0 ? (
              <div className="space-y-3">
                {todayTrips.map(trip => (
                  <div key={trip.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 dark:bg-slate-800/50 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-gray-900 dark:text-slate-100 text-lg">
                        {trip.route?.originCity} <i className="ti ti-arrow-right text-gray-400 text-sm" /> {trip.route?.destinationCity}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1"><i className="ti ti-clock text-brand" /> {format(new Date(trip.departureTime), 'HH:mm')}</span>
                        <span className="flex items-center gap-1"><i className="ti ti-bus text-gray-400" /> {trip.vehicle?.licensePlate}</span>
                      </div>
                    </div>
                    <Link to={`/staff/trips/${trip.id}/check-in`} className="shrink-0 w-full sm:w-auto">
                      <Button fullWidth icon={<i className="ti ti-ticket" />}>Soát vé</Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Hôm nay bạn được nghỉ!" description="Không có chuyến xe nào được phân công cho bạn trong hôm nay." icon="ti-calendar-smile" />
            )}
          </Card>

          {/* Upcoming Trips */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <i className="ti ti-route text-brand" /> Chuyến xe sắp tới
              </h2>
              <Link to="/staff/trips" className="text-sm font-semibold text-brand hover:underline">Xem tất cả</Link>
            </div>
            {upcomingTrips?.length > 0 ? (
              <div className="space-y-3">
                {upcomingTrips.filter(t => !todayTrips?.find(td => td.id === t.id)).slice(0, 3).map(trip => (
                  <div key={trip.id} className="p-3 rounded-lg border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 dark:border-slate-700">
                    <div className="font-medium text-gray-900 dark:text-slate-200">
                      {trip.route?.originCity} ➔ {trip.route?.destinationCity}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(trip.departureTime), 'HH:mm - dd/MM', { locale: vi })}
                    </div>
                  </div>
                ))}
                {upcomingTrips.filter(t => !todayTrips?.find(td => td.id === t.id)).length === 0 && (
                   <p className="text-sm text-gray-500 text-center py-4">Không có chuyến xe nào sắp tới.</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">Không có chuyến xe nào sắp tới.</p>
            )}
          </Card>
        </div>

        {/* Right Column: Profile, Stats, Notifications */}
        <div className="space-y-6">
          {/* Profile & Stats */}
          <Card className="bg-gradient-to-br from-brand to-orange-400 text-white border-0 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <i className="ti ti-steering-wheel text-6xl" />
            </div>
            <div className="relative z-10">
              <h3 className="font-semibold text-orange-50 opacity-90 uppercase tracking-wider text-xs mb-1">Thông tin cá nhân</h3>
              <p className="text-xl font-bold mb-4">{staffProfile.fullName || user?.email}</p>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/20">
                  <p className="text-orange-100 text-xs font-medium">Số chuyến đã chạy</p>
                  <p className="text-2xl font-black">{stats?.totalTrips || 0}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/20">
                  <p className="text-orange-100 text-xs font-medium">Tổng giờ làm (ước tính)</p>
                  <p className="text-2xl font-black">{stats?.workingHours || 0}h</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Notifications */}
          <Card>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="ti ti-bell-ringing text-brand" /> Thông báo từ quản trị
            </h2>
            {notifications?.length > 0 ? (
              <div className="space-y-4">
                {notifications.map(notif => (
                  <div key={notif.id} className="relative pl-4 border-l-2 border-brand">
                    <h4 className="text-sm font-bold text-gray-800 dark:text-slate-200">{notif.title}</h4>
                    <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">{notif.content}</p>
                    <span className="text-[10px] text-gray-400 mt-2 block">{format(new Date(notif.date), 'dd/MM/yyyy HH:mm')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Không có thông báo" description="Bạn đã đọc hết mọi thông báo." icon="ti-check" />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

