import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import { PageHeader, Table, Thead, Tbody, Tr, Th, Td, Badge, EmptyState, Loading } from '../../components/ui';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getAuditLogs({ page: 1, limit: 50 })
      .then(r => setLogs(r.data.data))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Nhật ký kiểm toán" 
        description="Theo dõi hoạt động của hệ thống." 
      />
      
      {loading ? (
        <Loading />
      ) : logs.length === 0 ? (
        <EmptyState title="Không có nhật ký nào" description="Hệ thống chưa ghi nhận hoạt động nào." icon="ti-history" />
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>Thời gian</Th>
              <Th>Người dùng</Th>
              <Th>Hành động</Th>
              <Th>Tài nguyên</Th>
              <Th>IP</Th>
            </Tr>
          </Thead>
          <Tbody>
            {logs.map(log => (
              <Tr key={log.id}>
                <Td className="whitespace-nowrap font-medium text-gray-500">
                  {new Date(log.createdAt).toLocaleString('vi-VN')}
                </Td>
                <Td className="font-bold text-gray-900 dark:text-gray-100">{log.user?.email || log.user?.phone || '—'}</Td>
                <Td>
                  <Badge variant="info">{log.action}</Badge>
                </Td>
                <Td className="text-gray-600 dark:text-gray-400 font-medium">{log.resource}</Td>
                <Td className="font-mono text-xs text-gray-400">{log.ipAddress || '—'}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </div>
  );
}
