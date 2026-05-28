import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { adminAPI } from '../../services/api';
import { formatInvoiceCode, formatTicketCode } from '../../utils/codes';

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const pickDriver = (tripStaffs = []) =>
  tripStaffs.find(item => item.role === 'DRIVER' || item.staff?.role === 'DRIVER') || tripStaffs[0];

const ReviewMeta = ({ label, value, mono = false }) => (
  <div className="min-w-0 rounded-xl bg-gray-50 px-3 py-2">
    <p className="text-xs font-medium text-gray-500">{label}</p>
    <p className={`mt-1 min-w-0 break-words text-sm font-semibold text-gray-800 ${mono ? 'font-mono text-xs leading-relaxed' : ''}`}>
      {value || '-'}
    </p>
  </div>
);

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminAPI.getPendingReviews()
      .then(r => setReviews(r.data.data))
      .catch(() => setError('Không thể tải danh sách đánh giá chờ duyệt.'))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const avg = reviews.length
      ? reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length
      : 0;
    return { total: reviews.length, avg: Math.round(avg * 10) / 10 };
  }, [reviews]);

  const handleApprove = async (id) => {
    try {
      await adminAPI.approveReview(id);
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch {
      alert('Duyệt đánh giá thất bại.');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Từ chối và xóa đánh giá này?')) return;
    try {
      await adminAPI.rejectReview(id);
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch {
      alert('Từ chối đánh giá thất bại.');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Kiểm duyệt đánh giá</h1>
          <p className="mt-1 text-sm text-gray-500">
            Xem đủ chuyến xe, tài xế, vé và nội dung trước khi duyệt công khai.
          </p>
        </div>
        {!loading && (
          <div className="flex gap-2 text-sm">
            <span className="rounded-xl bg-gray-100 px-3 py-2 font-semibold text-gray-700">{stats.total} chờ duyệt</span>
            <span className="rounded-xl bg-yellow-100 px-3 py-2 font-semibold text-yellow-700">{stats.avg || 0}/5 trung bình</span>
          </div>
        )}
      </div>

      {error && <div className="card mb-4 border-red-200 bg-red-50 text-sm font-medium text-red-700">{error}</div>}

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(item => (
            <div key={item} className="card animate-pulse">
              <div className="h-5 w-48 rounded bg-gray-100" />
              <div className="mt-3 h-20 rounded bg-gray-100" />
              <div className="mt-3 grid gap-2 md:grid-cols-4">
                {[1, 2, 3, 4].map(block => <div key={block} className="h-14 rounded bg-gray-100" />)}
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="card text-center py-14">
          <p className="font-semibold text-gray-800">Không có đánh giá nào cần duyệt</p>
          <p className="mt-1 text-sm text-gray-500">Các đánh giá mới từ khách hàng sẽ xuất hiện tại đây.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(rv => {
            const ticket = rv.ticketDetail;
            const trip = ticket?.tripSeat?.trip;
            const route = trip?.route;
            const driver = pickDriver(trip?.tripStaffs)?.staff;
            const seat = ticket?.tripSeat?.seatLayout;
            const departure = trip?.departureTime
              ? format(new Date(trip.departureTime), 'HH:mm - EEEE, dd/MM/yyyy', { locale: vi })
              : '-';
            const arrival = trip?.estimatedArrival
              ? format(new Date(trip.estimatedArrival), 'HH:mm dd/MM/yyyy')
              : '-';

            return (
              <article key={rv.id} className="card">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-800">{rv.customer?.fullName || 'Khách hàng'}</span>
                      <span className="text-yellow-500">{'★'.repeat(rv.rating)}</span>
                      <span className="text-xs text-gray-400">({rv.rating}/5)</span>
                      <span className="badge bg-gray-100 text-gray-600">{new Date(rv.createdAt).toLocaleString('vi-VN')}</span>
                    </div>

                    {rv.comment ? (
                      <p className="mb-4 break-words rounded-xl bg-gray-50 px-3 py-3 text-sm text-gray-700">
                        “{rv.comment}”
                      </p>
                    ) : (
                      <p className="mb-4 rounded-xl bg-gray-50 px-3 py-3 text-sm text-gray-400">Khách không nhập nhận xét.</p>
                    )}

                    <div className="mb-4 rounded-2xl border border-gray-100 bg-white/70 p-3">
                      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <p className="break-words text-base font-bold text-gray-900">
                            {route?.originCity || '-'} → {route?.destinationCity || '-'}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">{departure}</p>
                        </div>
                        <span className="badge bg-blue-100 text-blue-700">{trip?.status || 'Không rõ'}</span>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <ReviewMeta label="Nhà xe" value={route?.operator?.companyName} />
                      <ReviewMeta label="Hotline nhà xe" value={route?.operator?.hotline} />
                      <ReviewMeta label="Tài xế" value={driver ? `${driver.fullName}${driver.phone ? ` · ${driver.phone}` : ''}` : 'Chưa phân công'} />
                      <ReviewMeta label="Xe" value={[trip?.vehicle?.licensePlate, trip?.vehicle?.vehicleType?.name].filter(Boolean).join(' · ')} />
                      <ReviewMeta label="Ghế" value={seat ? `${seat.seatCode}${seat.floor ? ` · Tầng ${seat.floor}` : ''}` : '-'} />
                      <ReviewMeta label="Hành khách" value={[ticket?.passengerName, ticket?.passengerPhone].filter(Boolean).join(' · ')} />
                      <ReviewMeta label="Giá vé" value={formatMoney(ticket?.price)} />
                      <ReviewMeta label="Dự kiến đến" value={arrival} />
                      <ReviewMeta label="Mã vé" value={formatTicketCode(ticket)} mono />
                      <ReviewMeta label="Mã hóa đơn" value={formatInvoiceCode(ticket?.order)} mono />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 xl:w-40 xl:shrink-0 xl:grid-cols-1">
                    <button onClick={() => handleApprove(rv.id)}
                      className="rounded-lg bg-green-100 px-3 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-200">
                      Duyệt
                    </button>
                    <button onClick={() => handleReject(rv.id)}
                      className="rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-200">
                      Từ chối
                    </button>
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
