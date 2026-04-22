import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketAPI, bookingAPI, reviewAPI } from '../../services/api';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewed, setReviewed] = useState(false);

  useEffect(() => {
    ticketAPI.getById(id)
      .then(r => setTicket(r.data.data))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Bạn có chắc muốn hủy vé này không?')) return;
    setCancelling(true);
    try {
      const res = await bookingAPI.cancelTicket(id);
      alert(res.data.message);
      navigate('/my-tickets');
    } catch (err) {
      alert(err.response?.data?.message || 'Hủy vé thất bại.');
    } finally {
      setCancelling(false);
    }
  };

  const handleReview = async () => {
    try {
      await reviewAPI.create({ ticketDetailId: id, rating, comment });
      setReviewed(true);
      setShowReview(false);
      alert('Cảm ơn đánh giá của bạn!');
    } catch (err) {
      alert(err.response?.data?.message || 'Gửi đánh giá thất bại.');
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-500">Đang tải...</div>;
  if (!ticket) return <div className="text-center py-16 text-gray-500">Không tìm thấy vé.</div>;

  const trip = ticket.tripSeat?.trip;
  const route = trip?.route;
  const canCancel = ['PENDING', 'PAID'].includes(ticket.status);
  const canReview = ticket.status === 'COMPLETED' && !reviewed;

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="text-brand text-sm mb-6 hover:underline">
        ← Quay lại
      </button>

      <div className="card">
        {/* Header */}
        <div className="text-center border-b border-dashed border-gray-200 pb-5 mb-5">
          <div className="text-4xl mb-2">🎫</div>
          <h1 className="text-xl font-bold text-gray-800">
            {route?.originCity} → {route?.destinationCity}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {trip && format(new Date(trip.departureTime), 'HH:mm — EEEE, dd/MM/yyyy', { locale: vi })}
          </p>
        </div>

        {/* Info */}
        <div className="space-y-3 text-sm">
          {[
            ['Nhà xe', route?.operator?.companyName || trip?.vehicle?.vehicleType?.name],
            ['Hành khách', ticket.passengerName],
            ['Số điện thoại', ticket.passengerPhone || '—'],
            ['Số ghế', ticket.tripSeat?.seatLayout?.seatCode],
            ['Loại xe', trip?.vehicle?.vehicleType?.name],
            ['Giá vé', `${Number(ticket.price).toLocaleString('vi-VN')}đ`],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <span className="text-gray-500">{label}</span>
              <span className="font-medium text-gray-800">{value}</span>
            </div>
          ))}

          <div className="flex justify-between">
            <span className="text-gray-500">Trạng thái</span>
            <span className={`badge ${
              ticket.status === 'PAID' ? 'bg-green-100 text-green-700' :
              ticket.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
              ticket.status === 'CANCELLED' ? 'bg-gray-100 text-gray-500' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {ticket.status === 'PAID' ? 'Đã thanh toán' :
               ticket.status === 'COMPLETED' ? 'Hoàn thành' :
               ticket.status === 'CANCELLED' ? 'Đã hủy' :
               ticket.status === 'REFUNDED' ? 'Đã hoàn tiền' : 'Chờ thanh toán'}
            </span>
          </div>
        </div>

        {/* QR Code */}
        {ticket.qrCode && ticket.status === 'PAID' && (
          <div className="mt-6 text-center border-t border-dashed border-gray-200 pt-5">
            <p className="text-xs text-gray-500 mb-3">Xuất trình mã QR này khi lên xe</p>
            <img src={ticket.qrCode} alt="QR Code" className="mx-auto w-40 h-40 rounded-lg" />
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 space-y-2">
          {canCancel && (
            <button onClick={handleCancel} disabled={cancelling}
              className="btn-outline w-full py-2.5 text-sm border-red-300 text-red-600 hover:bg-red-50">
              {cancelling ? 'Đang hủy...' : '🗑️ Hủy vé'}
            </button>
          )}
          {canReview && !showReview && (
            <button onClick={() => setShowReview(true)}
              className="btn-outline w-full py-2.5 text-sm">
              ⭐ Đánh giá chuyến đi
            </button>
          )}
        </div>

        {/* Review form */}
        {showReview && (
          <div className="mt-4 p-4 bg-orange-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">Đánh giá chuyến đi</h3>
            <div className="flex gap-2 mb-3">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setRating(n)}
                  className={`text-2xl transition-transform hover:scale-110 ${n <= rating ? '' : 'opacity-30'}`}>
                  ⭐
                </button>
              ))}
            </div>
            <textarea className="input" rows={3} placeholder="Nhận xét của bạn (tuỳ chọn)..."
              value={comment} onChange={e => setComment(e.target.value)} />
            <div className="flex gap-2 mt-2">
              <button onClick={handleReview} className="btn-primary flex-1 py-2 text-sm">Gửi đánh giá</button>
              <button onClick={() => setShowReview(false)} className="btn-outline flex-1 py-2 text-sm">Huỷ</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
