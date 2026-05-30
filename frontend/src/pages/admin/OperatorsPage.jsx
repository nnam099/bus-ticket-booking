import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';

const STATUS_BADGE = {
  approved: 'inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700',
  pending:  'inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-700',
};

export default function AdminOperatorsPage() {
  const [tab, setTab] = useState('list'); // 'list' | 'pending'

  // --- Tab: Danh sách nhà xe ---
  const [allOps, setAllOps] = useState([]);
  const [allLoading, setAllLoading] = useState(true);
  const [allError, setAllError] = useState('');
  const [search, setSearch] = useState('');

  // --- Tab: Chờ duyệt ---
  const [pending, setPending] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingError, setPendingError] = useState('');

  // Fetch all operators
  useEffect(() => {
    adminAPI.getAllOperators()
      .then(r => setAllOps(r.data.data))
      .catch(() => setAllError('Không thể tải danh sách nhà xe.'))
      .finally(() => setAllLoading(false));
  }, []);

  // Fetch pending operators
  useEffect(() => {
    adminAPI.getPendingOperators()
      .then(r => setPending(r.data.data))
      .catch(() => setPendingError('Không thể tải danh sách nhà xe chờ duyệt.'))
      .finally(() => setPendingLoading(false));
  }, []);

  const handleApprove = async (id) => {
    try {
      await adminAPI.approveOperator(id);
      // Move from pending list → update allOps status
      setPending(prev => prev.filter(op => op.id !== id));
      setAllOps(prev => prev.map(op =>
        op.id === id ? { ...op, isApproved: true } : op
      ));
    } catch {
      alert('Duyệt nhà xe thất bại.');
    }
  };

  const filteredOps = allOps.filter(op =>
    op.companyName?.toLowerCase().includes(search.toLowerCase()) ||
    op.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
    op.hotline?.includes(search)
  );

  const pendingCount = pending.length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý nhà xe</h1>
        <p className="mt-1 text-sm text-gray-500">Xem danh sách toàn bộ nhà xe và duyệt hồ sơ đăng ký mới.</p>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 border-b border-gray-200">
        <button
          id="tab-list"
          onClick={() => setTab('list')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'list'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Danh sách nhà xe
          <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {allOps.length}
          </span>
        </button>
        <button
          id="tab-pending"
          onClick={() => setTab('pending')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'pending'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Chờ duyệt
          {pendingCount > 0 && (
            <span className="ml-2 rounded-full bg-yellow-500 px-2 py-0.5 text-xs font-bold text-white">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* ===== TAB: DANH SÁCH NHÀ XE ===== */}
      {tab === 'list' && (
        <div>
          {/* Search bar */}
          <div className="mb-4">
            <input
              id="search-operators"
              type="text"
              placeholder="Tìm theo tên nhà xe, email, hotline…"
              className="input w-full max-w-md"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {allError && (
            <div className="card mb-4 border-red-200 bg-red-50 text-sm font-medium text-red-700">
              {allError}
            </div>
          )}

          {allLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="card animate-pulse">
                  <div className="h-5 w-48 rounded bg-gray-100" />
                  <div className="mt-2 h-4 w-64 rounded bg-gray-100" />
                </div>
              ))}
            </div>
          ) : filteredOps.length === 0 ? (
            <div className="card py-14 text-center">
              <p className="font-semibold text-gray-800">Không tìm thấy nhà xe nào</p>
              <p className="mt-1 text-sm text-gray-500">Thử thay đổi từ khóa tìm kiếm.</p>
            </div>
          ) : (
            <div className="card overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Nhà xe</th>
                    <th className="px-4 py-3">Liên hệ</th>
                    <th className="px-4 py-3 text-center">Tuyến</th>
                    <th className="px-4 py-3 text-center">Xe</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Ngày đăng ký</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredOps.map(op => (
                    <tr key={op.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800 break-words">{op.companyName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{op.licenseNumber || 'Chưa có mã số'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-700">{op.user?.email || '-'}</p>
                        <p className="text-xs text-gray-400">{op.hotline || '-'}</p>
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-gray-700">
                        {op._count?.routes ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-gray-700">
                        {op._count?.vehicles ?? '-'}
                      </td>
                      <td className="px-4 py-3">
                        {op.isApproved ? (
                          <span className={STATUS_BADGE.approved}>✔ Đã duyệt</span>
                        ) : (
                          <span className={STATUS_BADGE.pending}>⏳ Chờ duyệt</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {op.createdAt
                          ? new Date(op.createdAt).toLocaleDateString('vi-VN')
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-gray-100 px-4 py-2 text-xs text-gray-400">
                Hiển thị {filteredOps.length} / {allOps.length} nhà xe
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== TAB: CHỜ DUYỆT ===== */}
      {tab === 'pending' && (
        <div>
          {pendingError && (
            <div className="card mb-4 border-red-200 bg-red-50 text-sm font-medium text-red-700">
              {pendingError}
            </div>
          )}

          {pendingLoading ? (
            <div className="grid gap-3">
              {[1, 2, 3].map(item => (
                <div key={item} className="card animate-pulse">
                  <div className="h-5 w-56 rounded bg-gray-100" />
                  <div className="mt-3 h-4 w-72 rounded bg-gray-100" />
                </div>
              ))}
            </div>
          ) : pending.length === 0 ? (
            <div className="card py-14 text-center">
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
                      <p className="mt-1 text-sm text-gray-500">
                        Hotline: {op.hotline || '-'} · Mã số: {op.licenseNumber || '-'}
                      </p>
                      <p className="mt-1 break-words text-sm text-gray-500">
                        Email: {op.user?.email || '-'}
                      </p>
                      <p className="mt-0.5 break-words text-sm text-gray-500">
                        {op.address || 'Chưa cập nhật địa chỉ'}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        Đăng ký: {op.createdAt ? new Date(op.createdAt).toLocaleString('vi-VN') : '-'}
                      </p>
                    </div>
                    <button
                      id={`approve-op-${op.id}`}
                      onClick={() => handleApprove(op.id)}
                      className="btn-primary shrink-0 px-5 py-2 text-sm"
                    >
                      Duyệt nhà xe
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
