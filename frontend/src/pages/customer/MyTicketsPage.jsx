import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { userAPI } from '../../services/api';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { formatInvoiceCode, formatTicketCode } from '../../utils/codes';

const STATUS_MAP = {
  PENDING: { label: 'Chờ thanh toán', cls: 'bg-yellow-100 text-yellow-700', tone: 'border-yellow-200 bg-yellow-50' },
  PAID: { label: 'Đã thanh toán', cls: 'bg-green-100 text-green-700', tone: 'border-green-200 bg-green-50' },
  CHECKED_IN: { label: 'Đã lên xe', cls: 'bg-emerald-100 text-emerald-700', tone: 'border-emerald-200 bg-emerald-50' },
  COMPLETED: { label: 'Hoàn thành', cls: 'bg-blue-100 text-blue-700', tone: 'border-blue-200 bg-blue-50' },
  CANCELLED: { label: 'Đã hủy', cls: 'bg-gray-100 text-gray-500', tone: 'border-gray-200 bg-gray-50' },
  REFUNDED: { label: 'Đã hoàn tiền', cls: 'bg-purple-100 text-purple-700', tone: 'border-purple-200 bg-purple-50' },
};

const REVIEWABLE_STATUSES = new Set(['COMPLETED']);

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation();
  const success = location.state?.success;
  const paidOrder = location.state?.order;

  useEffect(() => {
    userAPI.getMyTickets()
      .then(r => setTickets(r.data.data))
      .catch(() => setError('Không thể tải danh sách vé. Vui lòng thử lại.'))
      .finally(() => setLoading(false));
  }, []);

  const reviewableTickets = useMemo(
    () => tickets.filter(ticket => REVIEWABLE_STATUSES.has(ticket.status) && !ticket.review),
    [tickets]
  );

  if (loading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3].map(item => (
          <div key={item} className="card animate-pulse">
            <div className="h-5 w-2/3 rounded bg-gray-100" />
            <div className="mt-4 h-4 w-1/2 rounded bg-gray-100" />
            <div className="mt-3 h-10 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Vé của tôi</h1>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý mã vé, QR, hủy vé và đánh giá chuyến đã hoàn thành.
          </p>
        </div>
        {reviewableTickets.length > 0 && (
          <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-brand">
            {reviewableTickets.length} vé chờ đánh giá
          </span>
        )}
      </div>

      {error && (
        <div className="card mb-5 border-red-200 bg-red-50 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="card mb-5 border-green-200 bg-green-50 text-green-700">
          <p className="font-bold">Đặt vé thành công. Vé của bạn đã được xác nhận.</p>
          {paidOrder && (
            <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              <div className="rounded-lg bg-white/80 px-4 py-3">
                <span className="text-green-700/70">Mã hóa đơn</span>
                <p className="break-all font-mono font-black text-gray-800">{formatInvoiceCode(paidOrder)}</p>
              </div>
              <div className="rounded-lg bg-white/80 px-4 py-3">
                <span className="text-green-700/70">Mã vé</span>
                <p className="break-all font-mono font-black text-gray-800">
                  {(paidOrder.ticketDetails || []).map((ticket) => formatTicketCode(ticket)).join(', ') || 'Đang cập nhật'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {reviewableTickets.length > 0 && (
        <div className="mb-5 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-gray-900">Bạn có chuyến đã hoàn thành</p>
              <p className="text-sm text-gray-600">Mở chi tiết vé để gửi đánh giá cho nhà xe.</p>
            </div>
            <Link to={`/my-tickets/${reviewableTickets[0].id}`} className="btn-primary px-4 py-2 text-center text-sm">
              Đánh giá ngay
            </Link>
          </div>
        </div>
      )}

      {tickets.length === 0 ? (
        <div className="card text-center py-16 text-gray-500">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-2xl">🎫</div>
          <p className="font-semibold text-gray-800">Bạn chưa có vé nào</p>
          <p className="mt-1 text-sm">Tìm chuyến phù hợp và đặt vé chỉ trong vài bước.</p>
          <Link to="/" className="btn-primary mt-4 inline-block">Đặt vé ngay</Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {tickets.map(ticket => {
            const badge = STATUS_MAP[ticket.status] || { label: ticket.status, cls: 'bg-gray-100 text-gray-500', tone: 'border-gray-200 bg-gray-50' };
            const trip = ticket.tripSeat?.trip;
            const route = trip?.route;
            const canReview = REVIEWABLE_STATUSES.has(ticket.status) && !ticket.review;
            const canCancel = ['PENDING', 'PAID'].includes(ticket.status);
            return (
              <article key={ticket.id} className={`card border ${badge.tone}`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h2 className="min-w-0 break-words text-lg font-bold text-gray-900">
                        {route?.originCity || '-'} → {route?.destinationCity || '-'}
                      </h2>
                      <span className={`badge ${badge.cls}`}>{badge.label}</span>
                      {canReview && <span className="badge bg-orange-100 text-brand">Chờ đánh giá</span>}
                    </div>
                    <p className="text-sm font-medium text-gray-500">
                      {trip ? format(new Date(trip.departureTime), 'HH:mm - EEEE, dd/MM/yyyy', { locale: vi }) : '-'}
                    </p>
                    <div className="mt-3 grid gap-2 text-xs text-gray-500 sm:grid-cols-2">
                      <p className="min-w-0 rounded-lg bg-white/80 px-3 py-2">
                        Mã vé: <strong className="break-all font-mono text-gray-800">{formatTicketCode(ticket)}</strong>
                      </p>
                      <p className="min-w-0 rounded-lg bg-white/80 px-3 py-2">
                        Hóa đơn: <strong className="break-all font-mono text-gray-800">{formatInvoiceCode(ticket.order || ticket.orderId)}</strong>
                      </p>
                    </div>
                    <p className="mt-3 text-sm text-gray-600">
                      Ghế <strong>{ticket.tripSeat?.seatLayout?.seatCode}</strong> · {ticket.passengerName}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 lg:w-44 lg:items-end">
                    <span className="text-xl font-bold text-brand">
                      {Number(ticket.price).toLocaleString('vi-VN')}đ
                    </span>
                    <div className="grid w-full grid-cols-2 gap-2 lg:grid-cols-1">
                      <Link to={`/my-tickets/${ticket.id}`} className="btn-primary px-3 py-2 text-center text-sm">
                        Xem vé
                      </Link>
                      {canReview ? (
                        <Link to={`/my-tickets/${ticket.id}`} className="btn-outline px-3 py-2 text-center text-sm">
                          Đánh giá
                        </Link>
                      ) : canCancel ? (
                        <Link to={`/my-tickets/${ticket.id}`} className="btn-outline px-3 py-2 text-center text-sm">
                          QR / Hủy
                        </Link>
                      ) : (
                        <Link to={`/my-tickets/${ticket.id}`} className="btn-outline px-3 py-2 text-center text-sm">
                          Chi tiết
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
