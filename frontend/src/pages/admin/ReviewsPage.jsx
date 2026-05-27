import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Kiểm duyệt đánh giá</h1>
        <p className="mt-1 text-sm text-gray-500">
          Duyệt nhận xét hợp lệ trước khi hiển thị công khai cho nhà xe.
        </p>
      </div>

      {error && <div className="card mb-4 border-red-200 bg-red-50 text-sm font-medium text-red-700">{error}</div>}

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(item => (
            <div key={item} className="card animate-pulse">
              <div className="h-5 w-48 rounded bg-gray-100" />
              <div className="mt-3 h-16 rounded bg-gray-100" />
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
          {reviews.map(rv => (
            <article key={rv.id} className="card">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-gray-800">{rv.customer?.fullName || 'Khách hàng'}</span>
                    <span className="text-yellow-500">{'★'.repeat(rv.rating)}</span>
                    <span className="text-xs text-gray-400">({rv.rating}/5)</span>
                  </div>
                  {rv.comment ? (
                    <p className="break-words rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-600">
                      “{rv.comment}”
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400">Khách không nhập nhận xét.</p>
                  )}
                  <p className="mt-2 text-xs text-gray-400">
                    {new Date(rv.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 md:flex md:shrink-0">
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
          ))}
        </div>
      )}
    </div>
  );
}
