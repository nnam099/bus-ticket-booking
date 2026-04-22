import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { bookingAPI, paymentAPI } from '../../services/api';

const PAYMENT_METHODS = [
  { value: 'E_WALLET', label: '💳 Ví điện tử (MoMo, ZaloPay)', gateway: 'MOMO' },
  { value: 'BANK_CARD', label: '🏦 Thẻ ngân hàng (ATM/Visa)', gateway: 'VNPAY' },
  { value: 'BANK_TRANSFER', label: '📲 Chuyển khoản ngân hàng', gateway: 'VNPAY' },
  { value: 'CASH', label: '💵 Tiền mặt tại quầy', gateway: null },
];

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedSeats, selectedTrip } = useSelector(s => s.booking);

  const { passengers } = location.state || {};
  const [method, setMethod] = useState('E_WALLET');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const totalAmount = selectedSeats.length * Number(selectedTrip?.basePrice || 0);

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Confirm booking (creates order + tickets)
      const confirmRes = await bookingAPI.confirm({
        tripId: selectedTrip.id,
        seatIds: selectedSeats.map(s => s.id),
        passengerInfo: passengers,
        totalAmount,
        paymentMethod: method,
      });

      const { order } = confirmRes.data.data;

      // 2. If online payment, initiate and redirect
      if (method !== 'CASH') {
        const payRes = await paymentAPI.initiate({
          orderId: order.id,
          method,
          gateway: PAYMENT_METHODS.find(m => m.value === method)?.gateway,
        });
        window.location.href = payRes.data.data.paymentUrl;
      } else {
        // Cash payment - go straight to success
        navigate('/my-tickets', { replace: true, state: { success: true } });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Thanh toán thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedTrip || !selectedSeats.length) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p>Không có thông tin đặt vé. <a href="/" className="text-brand underline">Về trang chủ</a></p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Thanh toán</h1>

      {/* Order summary */}
      <div className="card mb-6">
        <h2 className="font-semibold text-gray-700 mb-3">Tóm tắt đơn hàng</h2>
        <div className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">Tuyến</span>
            <span>{selectedTrip.route?.originCity} → {selectedTrip.route?.destinationCity}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Nhà xe</span>
            <span>{selectedTrip.route?.operator?.companyName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Số ghế</span>
            <span>{selectedSeats.map(s => s.seatCode).join(', ')}</span>
          </div>
          <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-base">
            <span>Tổng cộng</span>
            <span className="text-brand">{totalAmount.toLocaleString('vi-VN')}đ</span>
          </div>
        </div>
      </div>

      {/* Payment method */}
      <div className="card mb-6">
        <h2 className="font-semibold text-gray-700 mb-3">Phương thức thanh toán</h2>
        <div className="space-y-2">
          {PAYMENT_METHODS.map(m => (
            <label key={m.value}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition
                ${method === m.value ? 'border-brand bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="radio" value={m.value} checked={method === m.value}
                onChange={() => setMethod(m.value)} className="accent-brand" />
              <span className="text-sm font-medium">{m.label}</span>
            </label>
          ))}
        </div>
      </div>

      {error && (
        <div className="card border-red-200 bg-red-50 text-red-700 text-sm mb-4">{error}</div>
      )}

      <button onClick={handlePay} disabled={loading} className="btn-primary w-full py-4 text-base">
        {loading ? 'Đang xử lý...' : `Thanh toán ${totalAmount.toLocaleString('vi-VN')}đ`}
      </button>

      <p className="text-xs text-gray-400 text-center mt-3">
        Bằng cách thanh toán, bạn đồng ý với điều khoản sử dụng của BusTicket.
      </p>
    </div>
  );
}
