// AdminAuditPage.jsx
import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getAuditLogs({ page: 1, limit: 50 })
      .then(r => setLogs(r.data.data))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-16 text-gray-500">Đang tải...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Audit Log</h1>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500">
              <th className="pb-3 pr-4 font-medium">Thời gian</th>
              <th className="pb-3 pr-4 font-medium">Người dùng</th>
              <th className="pb-3 pr-4 font-medium">Hành động</th>
              <th className="pb-3 pr-4 font-medium">Tài nguyên</th>
              <th className="pb-3 font-medium">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="py-2.5 pr-4 text-gray-500 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString('vi-VN')}
                </td>
                <td className="py-2.5 pr-4">{log.user?.email || log.user?.phone || '—'}</td>
                <td className="py-2.5 pr-4">
                  <span className="badge bg-blue-50 text-blue-700">{log.action}</span>
                </td>
                <td className="py-2.5 pr-4 text-gray-600">{log.resource}</td>
                <td className="py-2.5 text-gray-400 text-xs">{log.ipAddress || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && (
          <div className="text-center py-12 text-gray-500">Không có log nào.</div>
        )}
      </div>
    </div>
  );
}
