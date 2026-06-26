import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { userAPI } from '../../services/api';
import { formatInvoiceCode, formatTicketCode } from '../../utils/codes';

const INVOICE_STATUS = {
  PENDING: { label: 'Chờ thanh toán', cls: 'bg-yellow-100 text-yellow-700', tone: 'border-yellow-200 bg-yellow-50/70' },
  PAID: { label: 'Đã thanh toán', cls: 'bg-green-100 text-green-700', tone: 'border-green-200 bg-green-50/70' },
  CANCELLED: { label: 'Đã hủy', cls: 'bg-gray-100 text-gray-600', tone: 'border-gray-200 bg-gray-50/70' },
  REFUNDED: { label: 'Đã hoàn tiền', cls: 'bg-purple-100 text-purple-700', tone: 'border-purple-200 bg-purple-50/70' },
};

const PAYMENT_STATUS = {
  PENDING: { label: 'Chờ xử lý', cls: 'bg-yellow-100 text-yellow-700' },
  SUCCESS: { label: 'Thành công', cls: 'bg-green-100 text-green-700' },
  FAILED: { label: 'Thất bại', cls: 'bg-red-100 text-red-700' },
  REFUNDED: { label: 'Đã hoàn tiền', cls: 'bg-purple-100 text-purple-700' },
};

const TICKET_STATUS = {
  ...INVOICE_STATUS,
  CHECKED_IN: { label: 'Đã lên xe', cls: 'bg-emerald-100 text-emerald-700' },
  COMPLETED: { label: 'Mua vé thành công', cls: 'bg-green-100 text-green-700' },
};

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

function Badge({ status, map }) {
  const badge = map[status] || { label: status || 'Chưa có', cls: 'bg-gray-100 text-gray-600' };
  return <span className={`badge ${badge.cls}`}>{badge.label}</span>;
}

function getPrimaryRoute(invoice) {
  const ticket = invoice.ticketDetails?.[0];
  return ticket?.tripSeat?.trip?.route;
}

export default function MyInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    Promise.all([
      userAPI.getMyInvoices(),
      userAPI.getMyLockedSeats().catch(() => ({ data: { data: [] } }))
    ])
      .then(([invRes, lockedRes]) => {
        const dbInvoices = invRes.data.data;
        const lockedSeats = lockedRes.data.data || [];
        
        const lockedByTrip = {};
        lockedSeats.forEach(seat => {
          if (!lockedByTrip[seat.tripId]) lockedByTrip[seat.tripId] = [];
          lockedByTrip[seat.tripId].push(seat);
        });
        
        const pseudoInvoices = Object.values(lockedByTrip).map(seats => {
           const trip = seats[0].trip;
           const amount = seats.reduce((sum, s) => sum + Number(trip.basePrice || 0), 0);
           return {
             id: `locked-${trip.id}`,
             isLocked: true,
             tripId: trip.id,
             status: 'PENDING',
             totalAmount: amount,
             createdAt: seats[0].lockedAt,
             ticketDetails: seats.map(s => ({
                id: `seat-${s.id}`,
                tripSeat: s,
                passengerName: 'Chưa nhập (ghế đang giữ)',
                price: trip.basePrice,
                status: 'PENDING'
             })),
             payments: []
           };
        });
        
        setInvoices([...pseudoInvoices, ...dbInvoices]);
      })
      .catch(() => setError('Không thể tải danh sách hóa đơn. Vui lòng thử lại.'))
      .finally(() => setLoading(false));
  }, []);

  const filteredInvoices = useMemo(() => (
    filter === 'all' ? invoices : invoices.filter(invoice => invoice.status === filter)
  ), [filter, invoices]);

  const counts = useMemo(() => ({
    all: invoices.length,
    PENDING: invoices.filter(invoice => invoice.status === 'PENDING').length,
    PAID: invoices.filter(invoice => invoice.status === 'PAID').length,
    REFUNDED: invoices.filter(invoice => invoice.status === 'REFUNDED').length,
  }), [invoices]);

  if (loading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3].map(item => (
          <div key={item} className="card animate-pulse">
            <div className="h-5 w-2/3 rounded bg-gray-100" />
            <div className="mt-4 h-4 w-1/2 rounded bg-gray-100" />
            <div className="mt-3 h-24 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Hóa đơn của tôi</h1>
          <p className="mt-1 text-sm text-gray-500">
            Xem hóa đơn đặt vé, trạng thái giao dịch và các vé thuộc từng hóa đơn.
          </p>
        </div>
        <Link to="/lookup" className="btn-outline px-4 py-2 text-center text-sm">
          Tra cứu mã hóa đơn
        </Link>
      </div>

      {error && (
        <div className="card mb-5 border-red-200 bg-red-50 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="mb-5 flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'PENDING', label: 'Chờ thanh toán' },
          { key: 'PAID', label: 'Đã thanh toán' },
          { key: 'REFUNDED', label: 'Hoàn tiền' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              filter === tab.key ? 'bg-brand text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label} ({counts[tab.key] || 0})
          </button>
        ))}
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="card py-16 text-center text-gray-500">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-2xl">🧾</div>
          <p className="font-semibold text-gray-800">
            {invoices.length === 0 ? 'Bạn chưa có hóa đơn nào' : 'Không có hóa đơn ở mục này'}
          </p>
          {invoices.length === 0 && (
            <>
              <p className="mt-1 text-sm">Khi đặt vé thành công, hóa đơn sẽ xuất hiện tại đây.</p>
              <Link to="/" className="btn-primary mt-4 inline-block">Đặt vé ngay</Link>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-5">
          {filteredInvoices.map(invoice => {
            const status = INVOICE_STATUS[invoice.status] || { tone: 'border-gray-200 bg-white' };
            const latestPayment = invoice.payments?.[0];
            const route = getPrimaryRoute(invoice);
            const ticketCount = invoice.ticketDetails?.length || 0;
            const canPay = invoice.status === 'PENDING';

            return (
              <article key={invoice.id} className={`card border ${status.tone}`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h2 className="break-all font-mono text-base font-black text-gray-900">
                        {formatInvoiceCode(invoice)}
                      </h2>
                      <Badge status={invoice.status} map={INVOICE_STATUS} />
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {route ? `${route.originCity} → ${route.destinationCity}` : 'Hóa đơn đặt vé'}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Tạo lúc {format(new Date(invoice.createdAt), 'HH:mm - dd/MM/yyyy', { locale: vi })}
                      {route?.operator?.companyName ? ` · ${route.operator.companyName}` : ''}
                    </p>
                  </div>

                  <div className="shrink-0 lg:text-right">
                    <p className="text-2xl font-black text-brand">{formatMoney(invoice.totalAmount)}</p>
                    <p className="mt-1 text-sm text-gray-500">{ticketCount} vé</p>
                    <div className="mt-2 flex justify-start lg:justify-end">
                      <Badge status={latestPayment?.status} map={PAYMENT_STATUS} />
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 rounded-2xl border border-gray-100 bg-white/80 p-4 md:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-400">Phương thức</p>
                    <p className="mt-1 font-semibold text-gray-800">
                      {latestPayment ? `${latestPayment.method}${latestPayment.gateway ? ` / ${latestPayment.gateway}` : ''}` : 'Chưa có giao dịch'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-400">Mã giao dịch</p>
                    <p className="mt-1 break-all font-mono text-sm font-semibold text-gray-800">
                      {latestPayment?.gatewayTxnId || latestPayment?.id || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-400">Ngày thanh toán</p>
                    <p className="mt-1 font-semibold text-gray-800">
                      {latestPayment?.paidAt ? format(new Date(latestPayment.paidAt), 'HH:mm - dd/MM/yyyy', { locale: vi }) : '-'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto rounded-2xl border border-gray-100 bg-white">
                  <table className="min-w-full divide-y divide-gray-100 text-sm">
                    <thead className="bg-gray-50 text-left text-gray-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">Mã vé</th>
                        <th className="px-4 py-3 font-medium">Hành khách</th>
                        <th className="px-4 py-3 font-medium">Ghế</th>
                        <th className="px-4 py-3 font-medium">Giá</th>
                        <th className="px-4 py-3 font-medium">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {invoice.ticketDetails?.map(ticket => (
                        <tr key={ticket.id}>
                          <td className="px-4 py-3">
                            <Link to={`/my-tickets/${ticket.id}`} className="break-all font-mono text-xs font-bold text-brand hover:underline">
                              {formatTicketCode(ticket)}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-800">{ticket.passengerName}</p>
                            <p className="text-xs text-gray-500">{ticket.passengerPhone || 'Không có SĐT'}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {ticket.tripSeat?.seatLayout?.seatCode || '-'}
                            {ticket.tripSeat?.seatLayout?.floor ? ` / Tầng ${ticket.tripSeat.seatLayout.floor}` : ''}
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-800">{formatMoney(ticket.price)}</td>
                          <td className="px-4 py-3"><Badge status={ticket.status} map={TICKET_STATUS} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  {canPay && invoice.isLocked ? (
                    <Link to={`/booking/${invoice.tripId}`} className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-yellow-600">
                      Tiếp tục đặt vé
                    </Link>
                  ) : canPay ? (
                    <Link to={`/my-tickets/order/${invoice.id}/pay`} className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-yellow-600">
                      Tiếp tục thanh toán
                    </Link>
                  ) : null}
                  <Link to="/my-tickets" className="btn-outline px-4 py-2 text-sm">
                    Xem vé của tôi
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
