import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { userAPI } from '../../services/api';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { formatInvoiceCode, formatTicketCode } from '../../utils/codes';
import { useSelector } from 'react-redux';

const STATUS_MAP = {
  PENDING: { label: 'Chờ thanh toán', cls: 'bg-yellow-100 text-yellow-700', tone: 'border-yellow-200 bg-yellow-50' },
  PAID: { label: 'Đã thanh toán', cls: 'bg-green-100 text-green-700', tone: 'border-green-200 bg-green-50' },
  CHECKED_IN: { label: 'Đã lên xe', cls: 'bg-emerald-100 text-emerald-700', tone: 'border-emerald-200 bg-emerald-50' },
  COMPLETED: { label: 'Mua vé thành công', cls: 'bg-green-100 text-green-700', tone: 'border-green-200 bg-green-50' },
  CANCELLED: { label: 'Đã hủy', cls: 'bg-gray-100 text-gray-500', tone: 'border-gray-200 bg-gray-50' },
  REFUNDED: { label: 'Đã hoàn tiền', cls: 'bg-purple-100 text-purple-700', tone: 'border-purple-200 bg-purple-50' },
};

const REVIEWABLE_STATUSES = new Set(['COMPLETED']);
const PENDING_PAYMENT_STATUSES = new Set(['PENDING']);
const CANCELLATION_DEADLINE_DAYS = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const canRefundCancelTicket = (ticket) => {
  const departureTime = ticket.tripSeat?.trip?.departureTime;
  if (!departureTime) return false;
  const deadline = new Date(new Date(departureTime).getTime() - CANCELLATION_DEADLINE_DAYS * MS_PER_DAY);
  return new Date() <= deadline;
};

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation();
  const success = location.state?.success;
  const paidOrder = location.state?.order;
  const { user } = useSelector(s => s.auth);

  useEffect(() => {
    userAPI.getMyTickets()
      .then(r => setTickets(r.data.data))
      .catch(() => setError('Không thể tải danh sách vé. Vui lòng thử lại.'))
      .finally(() => setLoading(false));
  }, []);

  const pendingTickets = useMemo(
    () => tickets.filter(ticket => PENDING_PAYMENT_STATUSES.has(ticket.status)),
    [tickets]
  );

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
            Quản lý mã vé, hủy vé và đánh giá chuyến đã hoàn thành.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {pendingTickets.length > 0 && (
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700">
              {pendingTickets.length} vé chờ thanh toán
            </span>
          )}
          {reviewableTickets.length > 0 && (
            <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-brand">
              {reviewableTickets.length} vé chờ đánh giá
            </span>
          )}
        </div>
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

      {pendingTickets.length > 0 && (
        <div className="mb-5 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-gray-900">Bạn có vé chưa thanh toán</p>
              <p className="text-sm text-gray-600">Hoàn tất thanh toán để xác nhận chỗ ngồi của bạn.</p>
            </div>
            <Link
              to={`/my-tickets/order/${pendingTickets[0].order?.id}/pay`}
              className="btn-primary px-4 py-2 text-center text-sm bg-yellow-500 hover:bg-yellow-600"
            >
              Thanh toán ngay
            </Link>
          </div>
        </div>
      )}

      {reviewableTickets.length > 0 && (

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation();
  const success = location.state?.success;
  const paidOrder = location.state?.order;
  const { user } = useSelector(s => s.auth);

  useEffect(() => {
    userAPI.getMyTickets()
      .then(r => setTickets(r.data.data))
      .catch(() => setError('Không thể tải danh sách vé. Vui lòng thử lại.'))
      .finally(() => setLoading(false));
  }, []);

  const pendingTickets = useMemo(
    () => tickets.filter(ticket => PENDING_PAYMENT_STATUSES.has(ticket.status)),
    [tickets]
  );

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
            Quản lý mã vé, hủy vé và đánh giá chuyến đã hoàn thành.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {pendingTickets.length > 0 && (
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700">
              {pendingTickets.length} vé chờ thanh toán
            </span>
          )}
          {reviewableTickets.length > 0 && (
            <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-brand">
              {reviewableTickets.length} vé chờ đánh giá
            </span>
          )}
        </div>
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

      {pendingTickets.length > 0 && (
        <div className="mb-5 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-gray-900">Bạn có vé chưa thanh toán</p>
              <p className="text-sm text-gray-600">Hoàn tất thanh toán để xác nhận chỗ ngồi của bạn.</p>
            </div>
            <Link
              to={`/my-tickets/order/${pendingTickets[0].order?.id}/pay`}
              className="btn-primary px-4 py-2 text-center text-sm bg-yellow-500 hover:bg-yellow-600"
            >
              Thanh toán ngay
            </Link>
          </div>
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

      {tickets.filter(t => t.status !== 'PENDING').length === 0 ? (
        <div className="card text-center py-16 text-gray-500">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-2xl">🎫</div>
          <p className="font-semibold text-gray-800">Bạn chưa có vé nào đã thanh toán</p>
          <p className="mt-1 text-sm">Tìm chuyến phù hợp và đặt vé chỉ trong vài bước.</p>
          <Link to="/" className="btn-primary mt-4 inline-block">Đặt vé ngay</Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {tickets.filter(t => t.status !== 'PENDING').map(ticket => {
            const badge = STATUS_MAP[ticket.status] || { label: ticket.status, cls: 'bg-gray-100 text-gray-500', tone: 'border-gray-200 bg-gray-50' };
            const trip = ticket.tripSeat?.trip;
            const route = trip?.route;
            const canReview = REVIEWABLE_STATUSES.has(ticket.status) && !ticket.review;
            const canCancel = ticket.status === 'PAID' && canRefundCancelTicket(ticket);
          })}
        </div>
      )}
    </div>
  );
}
