import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { paymentAPI, bookingAPI } from '../../services/api';
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { formatInvoiceCode } from '../../utils/codes';

const PAYMENT_METHODS = [
  { value: 'E_WALLET', label: 'Ví điện tử (MoMo, ZaloPay)', icon: '💳', gateway: 'MOMO' },
  { value: 'BANK_CARD', label: 'Thẻ ngân hàng (ATM/Visa)', icon: '🏦', gateway: 'VNPAY' },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản ngân hàng', icon: '📲', gateway: 'VNPAY' },
];

function CountdownTimer({ expiresAt }) {
  const [remaining, setRemaining] = useState('');
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;

    const update = () => {
      const diff = new Date(expiresAt) - new Date();
      if (diff <= 0) {
        setExpired(true);
        setRemaining('00:00');
        setTimeout(() => window.location.reload(), 2000);
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemaining(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  if (!expiresAt) return null;

  return (
    <div className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold
      ${expired ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-amber-50 border border-amber-200 text-amber-800'}`}>
      <span className="text-xl">{expired ? '⚠️' : '⏱️'}</span>
      <div>
        {expired ? (
          <p>Phiên giữ ghế đã hết hạn. Ghế có thể đã được người khác đặt.</p>
        ) : (
          <>
            <p>Ghế đang được giữ trong <strong className="font-mono text-lg">{remaining}</strong></p>
            <p className="text-xs font-normal opacity-75">Hết giờ hệ thống tự động hủy ghế</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResumePaymentPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [method, setMethod] = useState('E_WALLET');
  const [paying, setPaying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [payError, setPayError] = useState('');

  useEffect(() => {
    paymentAPI.getOrderDetail(orderId)
      .then(r => setOrder(r.data.data))
      .catch(err => {
        const msg = err.response?.data?.message || 'Không thể tải thông tin đơn hàng.';
        const status = err.response?.data?.data?.status;
        if (status === 'PAID') {
          setError('Đơn hàng này đã được thanh toán.');
        } else if (status === 'CANCELLED') {
          setError('Đơn hàng này đã bị hủy.');
        } else {
          setError(msg);
        }
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  const handlePay = async () => {
    if (paying) return;
    setPaying(true);
    setPayError('');
    try {
      // Nếu đã có PENDING payment từ lần trước (user đóng browser giữa chừng),
      // dùng lại paymentId đó thay vì tạo mới → tránh lỗi 409
      const existingPending = order.payments?.find(p => p.status === 'PENDING');

      let paymentUrl;
      if (existingPending) {
        // Reconstruct payment URL từ paymentId cũ
        paymentUrl = `${window.location.origin}/payment/callback?paymentId=${existingPending.id}&mockStatus=success&amount=${order.totalAmount}`;
      } else {
        const gateway = PAYMENT_METHODS.find(m => m.value === method)?.gateway;
        const res = await paymentAPI.initiate({ orderId, method, gateway });
        paymentUrl = res.data.data.paymentUrl;
      }

      window.location.href = paymentUrl;
    } catch (err) {
      const msg = err.response?.data?.message || 'Thanh toán thất bại. Vui lòng thử lại.';
      setPayError(msg);
    } finally {
      setPaying(false);
    }
  };

  const handleCancel = async () => {
    if (cancelling || !order) return;
    if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;
    setCancelling(true);
    try {
      for (const ticket of order.ticketDetails) {
        await bookingAPI.cancelTicket(ticket.id);
      }
      navigate('/my-tickets', { replace: true });
    } catch {
      setPayError('Không thể hủy đơn hàng. Vui lòng thử lại.');
    } finally {
      setCancelling(false);
    }
  };

  // ─── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
        <div className="h-8 w-48 rounded-lg bg-gray-100 animate-pulse" />
        {[1, 2].map(i => (
          <div key={i} className="card animate-pulse space-y-3">
            <div className="h-5 w-2/3 rounded bg-gray-100" />
            <div className="h-4 w-1/2 rounded bg-gray-100" />
            <div className="h-10 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  // ─── Error state ─────────────────────────────────────────────────────────────
  if (error || !order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="card border-red-200 bg-red-50 text-center py-12">
          <div className="text-5xl mb-4">😕</div>
          <h1 className="text-lg font-bold text-red-700">{error || 'Không tìm thấy đơn hàng.'}</h1>
          <Link to="/my-tickets" className="btn-primary mt-6 inline-block">
            Quay lại Vé của tôi
          </Link>
        </div>
      </div>
    );
  }

  const trip = order.ticketDetails[0]?.tripSeat?.trip;
  const route = trip?.route;
  const operator = route?.operator;
  const totalAmount = Number(order.totalAmount);
  const seats = order.ticketDetails.map(t => t.tripSeat?.seatLayout?.seatCode).filter(Boolean);
  const existingPending = order.payments?.find(p => p.status === 'PENDING');
  const existingMethod = existingPending
    ? PAYMENT_METHODS.find(m => m.value === existingPending.method)
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Link to="/my-tickets" className="text-gray-400 hover:text-gray-600 transition text-2xl leading-none">‹</Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tiếp tục thanh toán</h1>
          <p className="text-sm text-gray-500 mt-0.5">Mã đơn: <span className="font-mono font-semibold text-gray-700">{formatInvoiceCode(order)}</span></p>
        </div>
      </div>

      {/* ── Countdown timer ── */}
      <CountdownTimer expiresAt={order.lockExpiresAt} />

      {!order.isLockValid && order.lockExpiresAt && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
          <strong>Lưu ý:</strong> Phiên giữ ghế đã hết hạn, tuy nhiên đơn hàng vẫn còn hiệu lực.
          Bạn vẫn có thể thử tiếp tục thanh toán — nếu ghế đã bị người khác đặt, hệ thống sẽ thông báo.
        </div>
      )}

      {/* ── Trip info ── */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-700">Thông tin chuyến</h2>

        <div className="flex items-center gap-3">
          <div className="flex-1 text-center">
            <p className="text-xl font-bold text-gray-900">{route?.originCity}</p>
            <p className="text-xs text-gray-500 mt-0.5">{route?.originAddress}</p>
          </div>
          <div className="flex flex-col items-center gap-1 text-brand">
            <span className="text-lg">🚌</span>
            <div className="h-px w-12 bg-brand/30" />
          </div>
          <div className="flex-1 text-center">
            <p className="text-xl font-bold text-gray-900">{route?.destinationCity}</p>
            <p className="text-xs text-gray-500 mt-0.5">{route?.destinationAddress}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-gray-50 px-3 py-2">
            <p className="text-xs text-gray-400">Khởi hành</p>
            <p className="font-semibold text-gray-800 mt-0.5">
              {trip?.departureTime ? format(new Date(trip.departureTime), 'HH:mm — dd/MM/yyyy', { locale: vi }) : '—'}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 px-3 py-2">
            <p className="text-xs text-gray-400">Nhà xe</p>
            <p className="font-semibold text-gray-800 mt-0.5">{operator?.companyName || '—'}</p>
          </div>
          <div className="rounded-lg bg-gray-50 px-3 py-2">
            <p className="text-xs text-gray-400">Ghế</p>
            <p className="font-semibold text-gray-800 mt-0.5 font-mono">{seats.join(', ') || '—'}</p>
          </div>
          <div className="rounded-lg bg-gray-50 px-3 py-2">
            <p className="text-xs text-gray-400">Loại xe</p>
            <p className="font-semibold text-gray-800 mt-0.5">{trip?.vehicle?.vehicleType?.name || '—'}</p>
          </div>
        </div>

        {/* Passenger list */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Hành khách</p>
          {order.ticketDetails.map((ticket, i) => (
            <div key={ticket.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
              <span className="font-medium text-gray-700">
                <span className="mr-2 inline-block rounded bg-brand/10 px-1.5 py-0.5 font-mono text-xs text-brand">
                  {ticket.tripSeat?.seatLayout?.seatCode}
                </span>
                {ticket.passengerName}
              </span>
              <span className="font-semibold text-brand">
                {Number(ticket.price).toLocaleString('vi-VN')}đ
              </span>
            </div>
          ))}

          <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold">
            <span>Tổng cộng</span>
            <span className="text-brand">{totalAmount.toLocaleString('vi-VN')}đ</span>
          </div>
        </div>
      </div>

      {/* ── Payment method ── */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-gray-700">Phương thức thanh toán</h2>
        {existingMethod ? (
          <div className="flex items-center gap-3 rounded-xl border-2 border-brand bg-orange-50 p-3">
            <span className="text-xl">{existingMethod.icon}</span>
            <div>
              <p className="text-sm font-semibold">{existingMethod.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">Phương thức từ lần thanh toán trước — sẽ tiếp tục với giao dịch này</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {PAYMENT_METHODS.map(m => (
              <label key={m.value}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition
                  ${method === m.value ? 'border-brand bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input
                  type="radio"
                  value={m.value}
                  checked={method === m.value}
                  onChange={() => setMethod(m.value)}
                  className="accent-brand"
                />
                <span className="text-xl">{m.icon}</span>
                <span className="text-sm font-medium">{m.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* ── Error ── */}
      {payError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {payError}
        </div>
      )}

      {/* ── Actions ── */}
      <div className="space-y-3">
        <button
          onClick={handlePay}
          disabled={paying || cancelling}
          className="btn-primary w-full py-4 text-base"
        >
          {paying ? 'Đang xử lý...' : `Thanh toán ${totalAmount.toLocaleString('vi-VN')}đ`}
        </button>

        <button
          onClick={handleCancel}
          disabled={paying || cancelling}
          className="btn-outline w-full py-3 text-sm text-red-600 border-red-200 hover:bg-red-50"
        >
          {cancelling ? 'Đang hủy...' : 'Hủy đơn hàng này'}
        </button>
      </div>

      <p className="text-center text-xs text-gray-400">
        Bằng cách thanh toán, bạn đồng ý với điều khoản sử dụng của BusTicket.
      </p>
    </div>
  );
}
