import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { bookingAPI, paymentAPI } from '../../services/api';
import { resetBooking, setCurrentOrder } from '../../store/slices/bookingSlice';
import BookingTimer from '../../components/customer/BookingTimer';

const PAYMENT_METHODS = [
  { value: 'E_WALLET', label: 'Ví điện tử (MoMo, ZaloPay)', gateway: 'MOMO' },
  { value: 'BANK_CARD', label: 'Thẻ ngân hàng (ATM/Visa)', gateway: 'VNPAY' },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản ngân hàng', gateway: 'VNPAY' },
  { value: 'CASH', label: 'Tiền mặt tại quầy', gateway: null },
];

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { selectedSeats, selectedTrip, lockExpiresAt, currentOrder } = useSelector(s => s.booking);

  const { passengers } = location.state || {};
  const [method, setMethod] = useState('E_WALLET');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingPayment, setPendingPayment] = useState(false);

  const totalAmount = selectedSeats.length * Number(selectedTrip?.basePrice || 0);
  const seatIds = selectedSeats.map(seat => seat.id);

  const handlePay = async () => {
    if (loading || pendingPayment) return;
    setLoading(true);
    setError(null);

    try {
      let order = currentOrder;
      let tickets = currentOrder?.ticketDetails || [];

      if (!order) {
        const confirmRes = await bookingAPI.confirm({
          tripId: selectedTrip.id,
          seatIds,
          passengerInfo: passengers,
          totalAmount,
          paymentMethod: method,
        });

        order = confirmRes.data.data.order;
        tickets = confirmRes.data.data.tickets;
        dispatch(setCurrentOrder({ ...order, ticketDetails: tickets }));
      }

      if (method === 'CASH') {
        dispatch(resetBooking());
        navigate('/my-tickets', { replace: true, state: { success: true, order: { ...order, ticketDetails: tickets } } });
        return;
      }

      const payRes = await paymentAPI.initiate({
        orderId: order.id,
        method,
        gateway: PAYMENT_METHODS.find(m => m.value === method)?.gateway,
      });
      window.location.href = payRes.data.data.paymentUrl;
    } catch (err) {
      const message = err.response?.data?.message || 'Thanh toán thất bại. Vui lòng thử lại.';
      if (err.response?.status === 409 || message.toLowerCase().includes('giao dịch thanh toán')) {
        setPendingPayment(true);
        setError('Đơn hàng này đang có giao dịch thanh toán chờ xử lý. Vui lòng hoàn tất giao dịch hiện có hoặc quay lại vé của tôi để kiểm tra trạng thái.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!selectedTrip || !selectedSeats.length) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p>Không có thông tin đặt vé. <Link to="/" className="text-brand underline">Về trang chủ</Link></p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Thanh toán</h1>
        <p className="text-sm text-gray-500">Ghế chỉ được giữ trong thời gian đếm ngược. Hết giờ hệ thống sẽ tự thả ghế.</p>
      </div>

      {lockExpiresAt && !currentOrder && (
        <BookingTimer
          expiresAt={lockExpiresAt}
          tripId={selectedTrip.id}
          seatIds={seatIds}
          redirectTo={`/booking/${selectedTrip.id}`}
        />
      )}

      <div className="card mb-6">
        <h2 className="font-semibold text-gray-700 mb-3">Tóm tắt đơn hàng</h2>
        <div className="text-sm space-y-2">
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Tuyến</span>
            <span className="text-right">{selectedTrip.route?.originCity} → {selectedTrip.route?.destinationCity}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Nhà xe</span>
            <span className="text-right">{selectedTrip.route?.operator?.companyName}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Số ghế</span>
            <span className="text-right">{selectedSeats.map(s => s.seatCode).join(', ')}</span>
          </div>
          {currentOrder && (
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Mã đơn</span>
              <span className="text-right font-semibold">HD-{currentOrder.id.slice(0, 8).toUpperCase()}</span>
            </div>
          )}
          <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-base">
            <span>Tổng cộng</span>
            <span className="text-brand">{totalAmount.toLocaleString('vi-VN')}đ</span>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="font-semibold text-gray-700 mb-3">Phương thức thanh toán</h2>
        <div className="space-y-2">
          {PAYMENT_METHODS.map(m => (
            <label key={m.value}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition
                ${method === m.value ? 'border-brand bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input
                type="radio"
                value={m.value}
                checked={method === m.value}
                disabled={Boolean(currentOrder)}
                onChange={() => setMethod(m.value)}
                className="accent-brand"
              />
              <span className="text-sm font-medium">{m.label}</span>
            </label>
          ))}
        </div>
        {currentOrder && (
          <p className="mt-3 text-xs font-medium text-gray-500">
            Đơn hàng đã được tạo, phương thức thanh toán được giữ nguyên để tránh tạo giao dịch trùng.
          </p>
        )}
      </div>

      {error && (
        <div className="card border-red-200 bg-red-50 text-red-700 text-sm mb-4">{error}</div>
      )}

      <button onClick={handlePay} disabled={loading || pendingPayment} className="btn-primary w-full py-4 text-base">
        {loading ? 'Đang xử lý...' : `Thanh toán ${totalAmount.toLocaleString('vi-VN')}đ`}
      </button>

      {pendingPayment && (
        <Link to="/my-tickets" className="btn-outline w-full py-3 text-center mt-3 block">
          Kiểm tra vé của tôi
        </Link>
      )}

      <p className="text-xs text-gray-400 text-center mt-3">
        Bằng cách thanh toán, bạn đồng ý với điều khoản sử dụng của BusTicket.
      </p>
    </div>
  );
}
