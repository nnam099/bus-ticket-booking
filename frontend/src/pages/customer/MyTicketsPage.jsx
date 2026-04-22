import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { userAPI } from '../../services/api';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const STATUS_MAP = {
  PENDING:   { label: 'Chờ thanh toán', cls: 'bg-yellow-100 text-yellow-700' },
  PAID:      { label: 'Đã thanh toán',  cls: 'bg-green-100 text-green-700' },
  COMPLETED: { label: 'Hoàn thành',     cls: 'bg-blue-100 text-blue-700' },
  CANCELLED: { label: 'Đã hủy',        cls: 'bg-gray-100 text-gray-500' },
  REFUNDED:  { label: 'Đã hoàn tiền',  cls: 'bg-purple-100 text-purple-700' },
};

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const success = location.state?.success;

  useEffect(() => {
    userAPI.getMyTickets()
      .then(r => setTickets(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-16 text-gray-500">Đang tải...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Vé của tôi</h1>

      {success && (
        <div className="card border-green-200 bg-green-50 text-green-700 mb-6">
          🎉 Đặt vé thành công! Vé của bạn đã được xác nhận.
        </div>
      )}

      {tickets.length === 0 ? (
        <div className="card text-center py-16 text-gray-500">
          <div className="text-5xl mb-3">🎫</div>
          <p className="font-semibold">Bạn chưa có vé nào</p>
          <Link to="/" className="btn-primary inline-block mt-4">Đặt vé ngay</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map(ticket => {
            const badge = STATUS_MAP[ticket.status] || { label: ticket.status, cls: 'bg-gray-100 text-gray-500' };
            const trip = ticket.tripSeat?.trip;
            const route = trip?.route;
            return (
              <Link key={ticket.id} to={`/my-tickets/${ticket.id}`}
                className="card hover:shadow-md transition-shadow block">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-800">
                        {route?.originCity} → {route?.destinationCity}
                      </span>
                      <span className={`badge ${badge.cls}`}>{badge.label}</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {trip && format(new Date(trip.departureTime), 'HH:mm — dd/MM/yyyy', { locale: vi })}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Ghế: <strong>{ticket.tripSeat?.seatLayout?.seatCode}</strong> •{' '}
                      {ticket.passengerName}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-brand">
                      {Number(ticket.price).toLocaleString('vi-VN')}đ
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5">Xem chi tiết →</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
