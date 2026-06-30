import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { paymentAPI, ticketAPI, userAPI } from '../services/api';
import { formatInvoiceCode, formatTicketCode } from '../utils/codes';
import { Ticket, Zap, Star, CreditCard, Search } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_MAP = {
  PENDING:    { label: 'Chờ thanh toán', cls: 'bg-yellow-100 text-yellow-700', tone: 'border-yellow-200 bg-yellow-50/60' },
  PAID:       { label: 'Đã thanh toán',  cls: 'bg-green-100 text-green-700',   tone: 'border-green-200 bg-green-50/60' },
  CHECKED_IN: { label: 'Đã lên xe',      cls: 'bg-emerald-100 text-emerald-700', tone: 'border-emerald-200 bg-emerald-50/60' },
  COMPLETED:  { label: 'Mua vé thành công', cls: 'bg-green-100 text-green-700',   tone: 'border-green-200 bg-green-50/60' },
  CANCELLED:  { label: 'Đã hủy',         cls: 'bg-gray-100 text-gray-500',     tone: 'border-gray-200 bg-gray-50/60' },
  REFUNDED:   { label: 'Đã hoàn tiền',   cls: 'bg-purple-100 text-purple-700', tone: 'border-purple-200 bg-purple-50/60' },
  FAILED:     { label: 'Thất bại',        cls: 'bg-red-100 text-red-700',       tone: 'border-red-200 bg-red-50/60' },
  SUCCESS:    { label: 'Thành công',      cls: 'bg-green-100 text-green-700',   tone: '' },
};

const formatMoney = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`;

function StatusBadge({ status }) {
  const badge = STATUS_MAP[status] || { label: status || '—', cls: 'bg-gray-100 text-gray-500' };
  return <span className={`badge ${badge.cls}`}>{badge.label}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public lookup result components
// ─────────────────────────────────────────────────────────────────────────────

function TicketResult({ ticket }) {
  const trip = ticket.tripSeat?.trip;
  const route = trip?.route;

  return (
    <div className="card mt-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-dashed border-gray-200 pb-5">
        <div>
          <p className="text-sm font-semibold text-brand">Mã vé {formatTicketCode(ticket)}</p>
          <h2 className="text-2xl font-black text-gray-800 mt-1">
            {route?.originCity} → {route?.destinationCity}
          </h2>
          <p className="text-gray-500 mt-1">
            {trip && format(new Date(trip.departureTime), 'HH:mm — EEEE, dd/MM/yyyy', { locale: vi })}
          </p>
        </div>
        <StatusBadge status={ticket.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mt-5">
        {[
          ['Mã hóa đơn', formatInvoiceCode(ticket.order || ticket.orderId)],
          ['Nhà xe', route?.operator?.companyName],
          ['Hành khách', ticket.passengerName],
          ['Số điện thoại', ticket.passengerPhone || '—'],
          ['Số ghế', ticket.tripSeat?.seatLayout?.seatCode],
          ['Loại xe', trip?.vehicle?.vehicleType?.name],
          ['Giá vé', formatMoney(ticket.price)],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 rounded-lg bg-gray-50 px-4 py-3">
            <span className="text-gray-500">{label}</span>
            <span className="font-semibold text-gray-800 text-right">{value || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InvoiceResult({ invoice }) {
  const latestPayment = invoice.payments?.[0];

  return (
    <div className="card mt-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-dashed border-gray-200 pb-5">
        <div>
          <p className="text-sm font-semibold text-brand">Mã hóa đơn {formatInvoiceCode(invoice)}</p>
          <h2 className="text-2xl font-black text-gray-800 mt-1">Hóa đơn đặt vé</h2>
          <p className="text-gray-500 mt-1">
            Ngày tạo {format(new Date(invoice.createdAt), 'HH:mm — dd/MM/yyyy', { locale: vi })}
          </p>
        </div>
        <StatusBadge status={invoice.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mt-5">
        <div className="flex justify-between gap-4 rounded-lg bg-gray-50 px-4 py-3">
          <span className="text-gray-500">Tổng tiền</span>
          <span className="font-bold text-brand">{formatMoney(invoice.totalAmount)}</span>
        </div>
        <div className="flex justify-between gap-4 rounded-lg bg-gray-50 px-4 py-3">
          <span className="text-gray-500">Thanh toán</span>
          <span className="font-semibold text-gray-800">{latestPayment?.method || '—'}</span>
        </div>
        <div className="flex justify-between gap-4 rounded-lg bg-gray-50 px-4 py-3">
          <span className="text-gray-500">Trạng thái giao dịch</span>
          <StatusBadge status={latestPayment?.status} />
        </div>
        <div className="flex justify-between gap-4 rounded-lg bg-gray-50 px-4 py-3">
          <span className="text-gray-500">Mã giao dịch</span>
          <span className="font-semibold text-gray-800 text-right">{latestPayment?.gatewayTxnId || latestPayment?.id || '—'}</span>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-bold text-gray-800 mb-3">Danh sách vé</h3>
        <div className="space-y-3">
          {invoice.ticketDetails?.map((ticket) => {
            const trip = ticket.tripSeat?.trip;
            const route = trip?.route;
            return (
              <div key={ticket.id} className="rounded-xl border border-gray-100 bg-white p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <p className="font-bold text-gray-800">{formatTicketCode(ticket)}</p>
                    <p className="text-sm text-gray-500">
                      {route?.originCity} → {route?.destinationCity} • Ghế {ticket.tripSeat?.seatLayout?.seatCode}
                    </p>
                    <p className="text-sm text-gray-500">{ticket.passengerName}</p>
                  </div>
                  <div className="text-left md:text-right">
                    <StatusBadge status={ticket.status} />
                    <p className="mt-1 font-bold text-brand">{formatMoney(ticket.price)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// My Tickets panel (logged-in customer)
// ─────────────────────────────────────────────────────────────────────────────

const FILTER_TABS = [
  { key: 'all',       label: 'Tất cả' },
  { key: 'active',    label: 'Đang diễn ra' },
  { key: 'pending',   label: 'Chờ thanh toán' },
  { key: 'completed', label: 'Mua vé thành công' },
  { key: 'cancelled', label: 'Đã hủy' },
];

function matchFilter(ticket, filter) {
  const s = ticket.status;
  if (filter === 'all') return true;
  if (filter === 'active') return ['CHECKED_IN'].includes(s);
  if (filter === 'pending') return s === 'PENDING';
  if (filter === 'completed') return ['PAID', 'COMPLETED'].includes(s);
  if (filter === 'cancelled') return ['CANCELLED', 'REFUNDED'].includes(s);
  return true;
}

function MyTicketsPanel() {
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [ticketError, setTicketError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    userAPI.getMyTickets()
      .then(r => setTickets(r.data.data))
      .catch(() => setTicketError('Không thể tải danh sách vé. Vui lòng thử lại.'))
      .finally(() => setLoadingTickets(false));
  }, []);

  const filtered = useMemo(() => tickets.filter(t => matchFilter(t, filter)), [tickets, filter]);

  const counts = useMemo(() => ({
    all: tickets.length,
    active: tickets.filter(t => matchFilter(t, 'active')).length,
    pending: tickets.filter(t => matchFilter(t, 'pending')).length,
    completed: tickets.filter(t => matchFilter(t, 'completed')).length,
    cancelled: tickets.filter(t => matchFilter(t, 'cancelled')).length,
  }), [tickets]);

  if (loadingTickets) {
    return (
      <div className="mt-6 grid gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="card animate-pulse space-y-3">
            <div className="h-5 w-2/3 rounded bg-gray-100" />
            <div className="h-4 w-1/2 rounded bg-gray-100" />
            <div className="h-10 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  if (ticketError) {
    return <div className="card mt-6 border-red-200 bg-red-50 text-red-700">{ticketError}</div>;
  }

  return (
    <div className="mt-6">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition
              ${filter === tab.key
                ? 'bg-brand text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-xs leading-none
                ${filter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-500 text-white'}`}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card py-14 text-center text-gray-500">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
            <Ticket className="w-6 h-6" />
          </div>
          <p className="font-semibold text-gray-700">
            {filter === 'all' ? 'Bạn chưa có vé nào' : 'Không có vé ở mục này'}
          </p>
          {filter === 'all' && (
            <Link to="/" className="btn-primary mt-4 inline-block text-sm">Đặt vé ngay</Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(ticket => {
            const badge = STATUS_MAP[ticket.status] || { label: ticket.status, cls: 'bg-gray-100 text-gray-500', tone: 'border-gray-200' };
            const trip = ticket.tripSeat?.trip;
            const route = trip?.route;
            const isPending = ticket.status === 'PENDING';
            const canCancel = ticket.status === 'PAID';
            const canReview = ticket.status === 'COMPLETED' && !ticket.review;

            return (
              <article key={ticket.id} className={`card border ${badge.tone} transition-shadow hover:shadow-md`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  {/* Left — route + meta */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-gray-900">
                        {route?.originCity || '—'} → {route?.destinationCity || '—'}
                      </h3>
                      <span className={`badge ${badge.cls}`}>{badge.label}</span>
                      {isPending && (
                        <span className="badge animate-pulse bg-yellow-100 text-yellow-700 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5" /> Cần thanh toán
                        </span>
                      )}
                      {canReview && (
                        <span className="badge bg-orange-100 text-brand flex items-center gap-1">
                          <Star className="w-3.5 h-3.5" /> Chờ đánh giá
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-500">
                      {trip
                        ? format(new Date(trip.departureTime), 'HH:mm — EEEE, dd/MM/yyyy', { locale: vi })
                        : '—'}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span>
                        Ghế <strong className="font-mono text-gray-700">{ticket.tripSeat?.seatLayout?.seatCode || '—'}</strong>
                      </span>
                      <span>·</span>
                      <span>{ticket.passengerName}</span>
                      <span>·</span>
                      <span className="font-mono">{formatTicketCode(ticket)}</span>
                    </div>
                  </div>

                  {/* Right — price + actions */}
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="text-lg font-bold text-brand">{formatMoney(ticket.price)}</span>

                    <div className="flex flex-wrap justify-end gap-2">
                      {isPending ? (
                        <>
                          <Link
                            to={`/my-tickets/order/${ticket.order?.id}/pay`}
                            className="rounded-lg bg-yellow-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-yellow-600 flex items-center gap-1.5"
                          >
                            <CreditCard className="w-3.5 h-3.5" /> Thanh toán
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link to={`/my-tickets/${ticket.id}`} className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1.5">
                            {canReview ? <><Star className="w-3.5 h-3.5" /> Đánh giá</> : canCancel ? <><Ticket className="w-3.5 h-3.5" /> Hủy</> : 'Xem vé'}
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-6 text-center">
        <Link to="/my-tickets" className="text-sm font-semibold text-brand hover:underline">
          Xem trang Vé của tôi đầy đủ →
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function LookupPage() {
  const { user } = useSelector(s => s.auth);
  const isCustomer = user?.roles?.includes('CUSTOMER');

  const [mode, setMode] = useState(() => isCustomer ? 'mine' : 'ticket');
  const [form, setForm] = useState({ code: '', phone: '' });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const tabs = [
    ...(isCustomer ? [{ value: 'mine', label: 'Vé của tôi' }] : []),
    { value: 'ticket', label: 'Tra cứu vé' },
    { value: 'invoice', label: 'Tra cứu hóa đơn' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const apiCall = mode === 'ticket' ? ticketAPI.lookup : paymentAPI.lookupInvoice;
      const res = await apiCall({ code: form.code.trim(), phone: form.phone.trim() });
      setResult(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Không tìm thấy thông tin phù hợp.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20 font-nunito transition-colors duration-300">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 pt-20 pb-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/4"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md shadow-xl border border-white/30 text-white mb-6">
            <Search className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 drop-shadow-md">Tra cứu vé & Hành trình</h1>
          <p className="text-blue-100 text-lg font-medium max-w-2xl mx-auto">
            {isCustomer
              ? 'Quản lý toàn bộ vé của bạn hoặc tra cứu nhanh qua mã hóa đơn.'
              : 'Nhập mã vé được cấp sau khi thanh toán kèm số điện thoại để kiểm tra trạng thái.'}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-20">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl shadow-indigo-900/10 border border-gray-100 dark:border-slate-700">
          {/* Tab switcher */}
        <div className="inline-flex flex-wrap rounded-xl bg-gray-100 p-1 mb-6 gap-0.5">
          {tabs.map(tab => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setMode(tab.value);
                setResult(null);
                setError('');
              }}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${
                mode === tab.value ? 'bg-white text-brand shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Lookup form — only for ticket / invoice tabs */}
        {mode !== 'mine' && (
          <>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4">
              <div>
                <label className="label">{mode === 'ticket' ? 'Mã vé' : 'Mã hóa đơn'}</label>
                <input
                  className="input"
                  placeholder={mode === 'ticket' ? 'VD: VE-AB12CD34' : 'VD: HD-AB12CD34'}
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Số điện thoại</label>
                <input
                  className="input"
                  placeholder="Số điện thoại hành khách"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary self-end px-8 py-3">
                {loading ? 'Đang tra...' : 'Tra cứu'}
              </button>
            </form>

            <p className="text-xs text-gray-400 mt-4">
              Bạn cũng có thể nhập mã đầy đủ trong chi tiết vé hoặc hóa đơn.
            </p>
          </>
        )}
      </div>

      {/* Results */}
      {mode === 'mine' && <MyTicketsPanel />}
      {mode !== 'mine' && error && (
        <div className="card border-red-200 bg-red-50 text-red-700 mt-6">{error}</div>
      )}
      {mode !== 'mine' && result && (
        mode === 'ticket' ? <TicketResult ticket={result} /> : <InvoiceResult invoice={result} />
      )}

      {/* Footer hint */}
      {!isCustomer && (
        <div className="mt-10 text-center text-sm text-gray-500">
          Đã đăng nhập?{' '}
          <Link to="/login" className="font-semibold text-brand hover:underline">Đăng nhập</Link>
          {' '}để xem nhanh vé của bạn.
        </div>
      )}
      </div>
    </div>
  );
}
