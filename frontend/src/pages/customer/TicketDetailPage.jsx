import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketAPI, bookingAPI, reviewAPI } from '../../services/api';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { formatInvoiceCode, formatTicketCode } from '../../utils/codes';
import { Ticket, Star, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const statusConfig = {
  PENDING: { label: 'Chờ thanh toán', className: 'bg-yellow-100 text-yellow-700' },
  PAID: { label: 'Đã thanh toán', className: 'bg-green-100 text-green-700' },
  CHECKED_IN: { label: 'Đã lên xe', className: 'bg-emerald-100 text-emerald-700' },
  COMPLETED: { label: 'Mua vé thành công', className: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-gray-100 text-gray-500' },
  REFUNDED: { label: 'Đã hoàn tiền', className: 'bg-purple-100 text-purple-700' },
};

const CANCELLATION_DEADLINE_DAYS = 3;
const REFUND_PERCENT = 90;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const getCancellationDeadline = (departureTime) => (
  departureTime ? new Date(new Date(departureTime).getTime() - CANCELLATION_DEADLINE_DAYS * MS_PER_DAY) : null
);

const isRefundCancellationAllowed = (departureTime) => {
  const deadline = getCancellationDeadline(departureTime);
  return Boolean(deadline && new Date() <= deadline);
};

const InfoItem = ({ label, value, strong = false }) => (
  <div className="min-w-0 rounded-xl bg-gray-50 px-3 py-2.5">
    <p className="text-xs font-medium text-gray-500">{label}</p>
    <p className={`mt-1 min-w-0 break-words text-sm ${strong ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>
      {value || '-'}
    </p>
  </div>
);

const CodeBlock = ({ label, value }) => (
  <div className="rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-sm">
    <p className="text-xs font-medium text-gray-500">{label}</p>
    <p className="mt-1 break-all font-mono text-xs leading-relaxed text-gray-800">{value || '-'}</p>
  </div>
);

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
  const ticketRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    ticketAPI.getById(id)
      .then((r) => {
        setTicket(r.data.data);
        setReviewed(Boolean(r.data.data.review));
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    const deadline = getCancellationDeadline(ticket?.tripSeat?.trip?.departureTime);
    const deadlineText = deadline ? format(deadline, 'HH:mm - dd/MM/yyyy', { locale: vi }) : '';
    const message = ticket?.status === 'PAID'
      ? `Bạn có chắc muốn hủy vé này không? Vé sẽ được hoàn ${REFUND_PERCENT}% nếu hủy trước ${deadlineText}.`
      : 'Bạn có chắc muốn hủy vé chưa thanh toán này không?';
    if (!window.confirm(message)) return;
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
      setTicket(prev => prev ? { ...prev, review: { rating, comment } } : prev);
      alert('Cảm ơn đánh giá của bạn!');
    } catch (err) {
      alert(err.response?.data?.message || 'Gửi đánh giá thất bại.');
    }
  };

  const handleDownloadPDF = async () => {
    if (!ticketRef.current) return;
    setDownloading(true);
    try {
      const element = ticketRef.current;
      // Chụp ảnh thẻ vé chất lượng cao (scale 3)
      const canvas = await html2canvas(element, { 
        scale: 3, 
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Vẽ background nền nhẹ cho file PDF
      pdf.setFillColor(250, 250, 250);
      pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
      
      // Header màu cam giả lập
      pdf.setFillColor(232, 93, 4); // #e85d04
      pdf.rect(0, 0, pdfWidth, 15, 'F');

      // Kích thước vé trên PDF (Căn giữa, để lại margin)
      const margin = 20; // 20mm
      const imgWidth = pdfWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const x = margin;
      const y = 35; // Cách top 35mm
      
      // Thêm bóng mờ/viền cho vé trong PDF
      pdf.setDrawColor(220, 220, 220);
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(x - 1, y - 1, imgWidth + 2, imgHeight + 2, 3, 3, 'FD');

      // Dán hình ảnh vé vào
      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);

      pdf.save(`Ve-BusGo-${formatTicketCode(ticket)}.pdf`);
    } catch (error) {
      console.error('Error generating PDF', error);
      alert('Có lỗi xảy ra khi tải vé.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-500">Đang tải...</div>;
  if (!ticket) return <div className="text-center py-16 text-gray-500">Không tìm thấy vé.</div>;

  const trip = ticket.tripSeat?.trip;
  const route = trip?.route;
  const ticketCode = formatTicketCode(ticket);
  const invoiceCode = formatInvoiceCode(ticket.order || ticket.orderId);
  const status = statusConfig[ticket.status] || statusConfig.PENDING;
  const canRefundCancel = ticket.status === 'PAID' && isRefundCancellationAllowed(trip?.departureTime);
  const canCancelPending = ticket.status === 'PENDING';
  const showCancelButton = canCancelPending || canRefundCancel;
  const canReview = ticket.status === 'COMPLETED' && !reviewed;
  const cancellationDeadline = getCancellationDeadline(trip?.departureTime);
  const departureText = trip
    ? `${format(new Date(trip.departureTime), 'HH:mm dd/MM/yyyy')} - ${format(new Date(trip.estimatedArrival), 'HH:mm dd/MM/yyyy')}`
    : '-';
  const cancellationDeadlineText = cancellationDeadline
    ? format(cancellationDeadline, 'HH:mm - dd/MM/yyyy', { locale: vi })
    : '';

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-5 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-sm font-semibold text-brand hover:underline">
        ← Quay lại
      </button>
        <button 
          onClick={handleDownloadPDF} 
          disabled={downloading}
          className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4" />
          {downloading ? 'Đang tải...' : 'Tải vé PDF'}
        </button>
      </div>

      <div ref={ticketRef} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-orange-50 to-white px-5 py-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-orange-600 shadow-sm">
            <Ticket className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            {route?.originCity || '-'} → {route?.destinationCity || '-'}
          </h1>
          <p className="mt-2 text-sm font-medium text-gray-500">{departureText}</p>
        </div>

        <div className="relative border-y border-dashed border-gray-200">
          <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-gray-50" />
          <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-gray-50" />
        </div>

        <div className="space-y-5 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <CodeBlock label="Mã vé" value={ticketCode} />
            <CodeBlock label="Mã hóa đơn" value={invoiceCode} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <InfoItem label="Nhà xe" value={route?.operator?.companyName || trip?.vehicle?.vehicleType?.name} />
            <InfoItem label="Loại xe" value={trip?.vehicle?.vehicleType?.name} />
            <InfoItem label="Hành khách" value={ticket.passengerName} />
            <InfoItem label="Số điện thoại" value={ticket.passengerPhone || '-'} />
            <InfoItem label="Số ghế" value={ticket.tripSeat?.seatLayout?.seatCode} strong />
            <InfoItem label="Giá vé" value={`${Number(ticket.price).toLocaleString('vi-VN')}đ`} strong />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-3">
            <span className="text-sm font-medium text-gray-500">Trạng thái vé</span>
            <span className={`badge ${status.className}`}>{status.label}</span>
          </div>

          <div className="space-y-2">
            {ticket.status === 'PAID' && (
              <div className={`rounded-xl border px-3 py-3 text-sm ${canRefundCancel ? 'border-orange-200 bg-orange-50 text-orange-800' : 'border-red-200 bg-red-50 text-red-700'}`}>
                {canRefundCancel
                  ? `Chính sách hủy vé: hoàn ${REFUND_PERCENT}% nếu hủy trước ${cancellationDeadlineText}.`
                  : `Đã quá hạn hủy/hoàn tiền. Vé chỉ được hủy trước giờ khởi hành ít nhất ${CANCELLATION_DEADLINE_DAYS} ngày.`}
              </div>
            )}
            {showCancelButton && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="w-full rounded-xl border border-red-300 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancelling ? 'Đang hủy...' : 'Hủy vé'}
              </button>
            )}
            {canReview && !showReview && (
              <button onClick={() => setShowReview(true)} className="btn-outline w-full py-3 text-sm">
                Đánh giá chuyến đi
              </button>
            )}
          </div>

          {showReview && (
            <div className="rounded-2xl bg-orange-50 p-4">
              <h3 className="mb-3 font-semibold text-gray-800">Đánh giá chuyến đi</h3>
              <div className="mb-3 flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setRating(n)}
                    className={`transition-transform hover:scale-110 ${n <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
                  >
                    <Star className="w-6 h-6" fill="currentColor" />
                  </button>
                ))}
              </div>
              <textarea
                className="input"
                rows={3}
                placeholder="Nhận xét của bạn (tùy chọn)..."
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button onClick={handleReview} className="btn-primary py-2 text-sm">Gửi đánh giá</button>
                <button onClick={() => setShowReview(false)} className="btn-outline py-2 text-sm">Hủy</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
