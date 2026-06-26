import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import { PageHeader, Input, Card, Table, Thead, Tbody, Tr, Th, Td, Badge, Button, EmptyState, Loading } from '../../components/ui';

export default function AdminOperatorsPage() {
  const [tab, setTab] = useState('list');

  const [allOps, setAllOps] = useState([]);
  const [allLoading, setAllLoading] = useState(true);
  const [allError, setAllError] = useState('');
  const [search, setSearch] = useState('');

  const [pending, setPending] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingError, setPendingError] = useState('');

  useEffect(() => {
    adminAPI.getAllOperators()
      .then(r => setAllOps(r.data.data))
      .catch(() => setAllError('Không thể tải danh sách nhà xe.'))
      .finally(() => setAllLoading(false));
  }, []);

  useEffect(() => {
    adminAPI.getPendingOperators()
      .then(r => setPending(r.data.data))
      .catch(() => setPendingError('Không thể tải danh sách nhà xe chờ duyệt.'))
      .finally(() => setPendingLoading(false));
  }, []);

  const handleApprove = async (id) => {
    try {
      await adminAPI.approveOperator(id);
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
    <div className="space-y-6">
      <PageHeader 
        title="Quản lý nhà xe" 
        description="Xem danh sách toàn bộ nhà xe và duyệt hồ sơ đăng ký mới." 
      />

      <div className="flex gap-4 border-b border-gray-200 dark:border-slate-800 mb-6">
        <button
          onClick={() => setTab('list')}
          className={`pb-3 px-2 text-sm font-bold transition-all border-b-2 ${
            tab === 'list'
              ? 'border-[#e85d04] text-[#e85d04]'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Danh sách nhà xe
          <span className="ml-2 rounded-full bg-gray-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs text-gray-600 dark:text-gray-300">
            {allOps.length}
          </span>
        </button>
        <button
          onClick={() => setTab('pending')}
          className={`pb-3 px-2 text-sm font-bold transition-all border-b-2 ${
            tab === 'pending'
              ? 'border-[#e85d04] text-[#e85d04]'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Chờ duyệt
          {pendingCount > 0 && (
            <span className="ml-2 rounded-full bg-yellow-500 px-2.5 py-0.5 text-xs font-bold text-white">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {tab === 'list' && (
        <div className="space-y-6">
          <Input
            type="text"
            placeholder="Tìm theo tên nhà xe, email, hotline…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-md"
            icon={<i className="ti ti-search" />}
          />

          {allError && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
              {allError}
            </Card>
          )}

          {allLoading ? (
            <Loading />
          ) : filteredOps.length === 0 ? (
            <EmptyState title="Không tìm thấy nhà xe nào" description="Thử thay đổi từ khóa tìm kiếm." icon="ti-search" />
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <Th>Nhà xe</Th>
                  <Th>Liên hệ</Th>
                  <Th className="text-center">Tuyến</Th>
                  <Th className="text-center">Xe</Th>
                  <Th>Trạng thái</Th>
                  <Th>Ngày đăng ký</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredOps.map(op => (
                  <Tr key={op.id}>
                    <Td>
                      <p className="font-bold text-gray-900 dark:text-white break-words">{op.companyName}</p>
                      <p className="text-xs text-gray-500 mt-1">{op.licenseNumber || 'Chưa có mã số'}</p>
                    </Td>
                    <Td>
                      <p className="font-medium text-gray-700 dark:text-gray-300">{op.user?.email || '-'}</p>
                      <p className="text-xs text-gray-500 mt-1">{op.hotline || '-'}</p>
                    </Td>
                    <Td className="text-center font-bold text-gray-700 dark:text-gray-300">
                      {op._count?.routes ?? '-'}
                    </Td>
                    <Td className="text-center font-bold text-gray-700 dark:text-gray-300">
                      {op._count?.vehicles ?? '-'}
                    </Td>
                    <Td>
                      {op.isApproved ? (
                        <Badge variant="success">Đã duyệt</Badge>
                      ) : (
                        <Badge variant="warning">Chờ duyệt</Badge>
                      )}
                    </Td>
                    <Td className="text-gray-500 whitespace-nowrap">
                      {op.createdAt ? new Date(op.createdAt).toLocaleDateString('vi-VN') : '-'}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </div>
      )}

      {tab === 'pending' && (
        <div className="space-y-6">
          {pendingError && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
              {pendingError}
            </Card>
          )}

          {pendingLoading ? (
            <Loading />
          ) : pending.length === 0 ? (
            <EmptyState title="Không có nhà xe nào chờ duyệt" description="Hồ sơ mới sẽ xuất hiện tại đây khi nhà xe đăng ký." icon="ti-building" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pending.map(op => (
                <Card key={op.id} className="flex flex-col h-full" hover>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white break-words">{op.companyName}</h3>
                    <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <p className="flex items-center gap-2"><i className="ti ti-phone text-[#e85d04]" /> {op.hotline || '-'}</p>
                      <p className="flex items-center gap-2"><i className="ti ti-id text-[#e85d04]" /> {op.licenseNumber || '-'}</p>
                      <p className="flex items-center gap-2"><i className="ti ti-mail text-[#e85d04]" /> {op.user?.email || '-'}</p>
                      <p className="flex items-center gap-2"><i className="ti ti-map-pin text-[#e85d04]" /> {op.address || 'Chưa cập nhật'}</p>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-800">
                    <Button fullWidth onClick={() => handleApprove(op.id)}>
                      Duyệt nhà xe
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
