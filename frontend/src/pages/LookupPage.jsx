import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { paymentAPI, ticketAPI } from '../services/api';
import { formatInvoiceCode, formatTicketCode } from '../utils/codes';

const STATUS_MAP = {
  PENDING: { label: 'Chờ thanh toán', cls: 'bg-yellow-100 text-yellow-700' },
  PAID: { label: 'Đã thanh toán', cls: 'bg-green-100 text-green-700' },
  CHECKED_IN: { label: 'Đã lên xe', cls: 'bg-emerald-100 text-emerald-700' },
  COMPLETED: { label: 'Hoàn thành', cls: 'bg-blue-100 text-blue-700' },
  CANCELLED: { label: 'Đã hủy', cls: 'bg-gray-100 text-gray-500' },
  REFUNDED: { label: 'Đã hoàn tiền', cls: 'bg-purple-100 text-purple-700' },
  FAILED: { label: 'Thất bại', cls: 'bg-red-100 text-red-700' },
  SUCCESS: { label: 'Thành công', cls: 'bg-green-100 text-green-700' },
};

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

function StatusBadge({ status }) {
  const badge = STATUS_MAP[status] || { label: status || '—', cls: 'bg-gray-100 text-gray-500' };
  return <span className={`badge ${badge.cls}`}>{badge.label}</span>;
}

function TicketResult({ ticket }) {
  const trip = ticket.tripSeat?.trip;
  const route = trip?.route;

  return (
    <div className="card mt-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-dashed border-gray-200 pb-5">
        <div>
          <p className="text-sm font-semibold text-brand">Mã vé {formatTicketCode(ticket.id)}</p>
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
          ['Mã hóa đơn', formatInvoiceCode(ticket.orderId)],
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

      {ticket.qrCode && ['PAID', 'CHECKED_IN'].includes(ticket.status) && (
        <div className="mt-6 border-t border-dashed border-gray-200 pt-5 text-center">
          <p className="text-xs text-gray-500 mb-3">Mã QR lên xe</p>
          <img src={ticket.qrCode} alt="QR Code" className="mx-auto h-36 w-36 rounded-lg" />
        </div>
      )}
    </div>
  );
}

function InvoiceResult({ invoice }) {
  const latestPayment = invoice.payments?.[0];

  return (
    <div className="card mt-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-dashed border-gray-200 pb-5">
        <div>
          <p className="text-sm font-semibold text-brand">Mã hóa đơn {formatInvoiceCode(invoice.id)}</p>
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
                    <p className="font-bold text-gray-800">{formatTicketCode(ticket.id)}</p>
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

export default function LookupPage() {
  const [mode, setMode] = useState('ticket');
  const [form, setForm] = useState({ code: '', phone: '' });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-gray-800">Tra cứu vé và hóa đơn</h1>
        <p className="text-gray-500 mt-2">Nhập mã được cấp sau thanh toán kèm số điện thoại đặt vé.</p>
      </div>

      <div className="card">
        <div className="inline-flex rounded-xl bg-gray-100 p-1 mb-6">
          {[
            ['ticket', 'Tra cứu vé'],
            ['invoice', 'Tra cứu hóa đơn'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setMode(value);
                setResult(null);
                setError('');
              }}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${
                mode === value ? 'bg-white text-brand shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

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
      </div>

      {error && <div className="card border-red-200 bg-red-50 text-red-700 mt-6">{error}</div>}

      {result && (mode === 'ticket' ? <TicketResult ticket={result} /> : <InvoiceResult invoice={result} />)}

      <div className="mt-8 text-center text-sm text-gray-500">
        Đã đăng nhập? <Link to="/my-tickets" className="font-semibold text-brand hover:underline">Xem vé của tôi</Link>
      </div>
    </div>
  );
}
