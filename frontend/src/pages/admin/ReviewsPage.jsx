// AdminReviewsPage.jsx
import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getPendingReviews()
      .then(r => setReviews(r.data.data))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id) => {
    try {
      await adminAPI.approveReview(id);
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch { alert('Duyệt đánh giá thất bại.'); }
  };

  const handleReject = (id) => {
    // In a real system you'd have a reject endpoint; here we just remove from UI
    setReviews(prev => prev.filter(r => r.id !== id));
  };

  if (loading) return <div className="text-center py-16 text-gray-500">Đang tải...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Kiểm duyệt đánh giá ({reviews.length})
      </h1>
      <div className="space-y-4">
        {reviews.map(rv => (
          <div key={rv.id} className="card">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-800">{rv.customer?.fullName}</span>
                  <span className="text-yellow-500">{'⭐'.repeat(rv.rating)}</span>
                  <span className="text-gray-400 text-xs">({rv.rating}/5)</span>
                </div>
                {rv.comment && (
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mt-1">
                    "{rv.comment}"
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(rv.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => handleApprove(rv.id)}
                  className="text-sm px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition font-medium">
                  ✓ Duyệt
                </button>
                <button onClick={() => handleReject(rv.id)}
                  className="text-sm px-3 py-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition font-medium">
                  ✗ Từ chối
                </button>
              </div>
            </div>
          </div>
        ))}
        {reviews.length === 0 && (
          <div className="card text-center py-12 text-gray-500">
            <div className="text-4xl mb-2">✅</div>
            <p>Không có đánh giá nào cần duyệt.</p>
          </div>
        )}
      </div>
    </div>
  );
}
