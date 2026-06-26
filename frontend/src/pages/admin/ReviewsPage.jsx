import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { adminAPI } from '../../services/api';
import { formatInvoiceCode, formatTicketCode } from '../../utils/codes';
import { PageHeader, Card, Badge, Button, EmptyState, Loading } from '../../components/ui';

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const pickDriver = (tripStaffs = []) =>
  tripStaffs.find(item => item.role === 'DRIVER' || item.staff?.role === 'DRIVER') || tripStaffs[0];

const ReviewMeta = ({ label, value, mono = false }) => (
  <div className="min-w-0 rounded-xl bg-gray-50 dark:bg-slate-800/50 px-4 py-3">
    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</p>
    <p className={`mt-1 min-w-0 break-words text-sm font-bold text-gray-800 dark:text-gray-200 ${mono ? 'font-mono text-xs leading-relaxed tracking-wider' : ''}`}>
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
    <div className="space-y-6">
      <PageHeader 
        title="Kiểm duyệt đánh giá" 
        description="Xem đủ chuyến xe, tài xế, vé và nội dung trước khi duyệt công khai." 
        actions={
          !loading && (
            <div className="flex gap-3">
              <Badge variant="default" className="text-sm px-4 py-2">{stats.total} chờ duyệt</Badge>
              <Badge variant="warning" className="text-sm px-4 py-2">{stats.avg || 0}/5 trung bình</Badge>
            </div>
          )
        }
      />

      {error && <Card className="border-red-200 bg-red-50 text-red-700">{error}</Card>}

      {loading ? (
        <Loading />
      ) : reviews.length === 0 ? (
        <EmptyState title="Không có đánh giá nào cần duyệt" description="Các đánh giá mới từ khách hàng sẽ xuất hiện tại đây." icon="ti-star" />
      ) : (
        <div className="space-y-6">
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
              <Card key={rv.id} hover>
                <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      <span className="font-black text-gray-900 dark:text-white text-lg">{rv.customer?.fullName || 'Khách hàng'}</span>
                      <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-2.5 py-1 rounded-lg">
                        <span className="text-yellow-500 tracking-widest text-sm">{'★'.repeat(rv.rating)}</span>
                        <span className="text-xs font-bold text-yellow-600 dark:text-yellow-500 ml-1">({rv.rating}/5)</span>
                      </div>
                      <Badge variant="default">{new Date(rv.createdAt).toLocaleString('vi-VN')}</Badge>
                    </div>

                    {rv.comment ? (
                      <p className="mb-6 break-words rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-800/80 px-5 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 italic">
                        “{rv.comment}”
                      </p>
                    ) : (
                      <p className="mb-6 rounded-xl border border-dashed border-gray-200 dark:border-slate-800 bg-transparent px-5 py-4 text-sm font-medium text-gray-400">Khách không nhập nhận xét.</p>
                    )}

                    <div className="mb-6 rounded-2xl border border-[#e85d04]/20 bg-orange-50/50 dark:bg-[#e85d04]/5 p-4">
                      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <p className="break-words text-lg font-black text-[#e85d04]">
                            {route?.originCity || '-'} → {route?.destinationCity || '-'}
                          </p>
                          <p className="mt-1.5 text-sm font-semibold text-gray-600 dark:text-gray-400">{departure}</p>
                        </div>
                        <Badge variant="info">{trip?.status || 'Không rõ'}</Badge>
                      </div>
                    </div>

                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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

                  <div className="flex flex-col gap-3 xl:w-48 xl:shrink-0 pt-2 border-t xl:border-t-0 xl:border-l border-gray-100 dark:border-slate-800 xl:pl-6">
                    <Button fullWidth onClick={() => handleApprove(rv.id)} variant="primary" className="!bg-green-500 hover:!bg-green-600 !shadow-[0_4px_16px_rgba(34,197,94,0.35)] border-none">
                      Duyệt đánh giá
                    </Button>
                    <Button fullWidth onClick={() => handleReject(rv.id)} variant="danger">
                      Từ chối & Xóa
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
