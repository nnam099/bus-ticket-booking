import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';

export default function AdminOperatorsPage() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminAPI.getPendingOperators()
      .then(r => setPending(r.data.data))
      .catch(() => setError('Không thể tải danh sách nhà xe chờ duyệt.'))
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id) => {
    try {
      await adminAPI.approveOperator(id);
      setPending(prev => prev.filter(op => op.id !== id));
    } catch {
      alert('Duyệt nhà xe thất bại.');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Nhà xe chờ duyệt</h1>
        <p className="mt-1 text-sm text-gray-500">Kiểm tra hồ sơ nhà xe trước khi cho phép mở bán chuyến.</p>
      </div>

      {error && <div className="card mb-4 border-red-200 bg-red-50 text-sm font-medium text-red-700">{error}</div>}

      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map(item => (
            <div key={item} className="card animate-pulse">
              <div className="h-5 w-56 rounded bg-gray-100" />
              <div className="mt-3 h-4 w-72 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : pending.length === 0 ? (
        <div className="card text-center py-14">
          <p className="font-semibold text-gray-800">Không có nhà xe nào chờ duyệt</p>
          <p className="mt-1 text-sm text-gray-500">Hồ sơ mới sẽ xuất hiện tại đây khi nhà xe đăng ký.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map(op => (
            <article key={op.id} className="card">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <p className="break-words font-semibold text-gray-800">{op.companyName}</p>
                  <p className="mt-1 text-sm text-gray-500">Hotline: {op.hotline || '-'} · Mã số: {op.licenseNumber || '-'}</p>
                  <p className="mt-1 break-words text-sm text-gray-500">{op.address || 'Chưa cập nhật địa chỉ'}</p>
                </div>
                <button onClick={() => handleApprove(op.id)} className="btn-primary px-4 py-2 text-sm">
                  Duyệt nhà xe
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
