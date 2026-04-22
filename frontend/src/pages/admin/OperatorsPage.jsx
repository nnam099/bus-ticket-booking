// admin/OperatorsPage.jsx
import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';

export default function AdminOperatorsPage() {
  const [pending, setPending] = useState([]);
  useEffect(() => { adminAPI.getPendingOperators().then(r => setPending(r.data.data)); }, []);

  const handleApprove = async (id) => {
    await adminAPI.approveOperator(id);
    setPending(prev => prev.filter(op => op.id !== id));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Nhà xe chờ duyệt ({pending.length})</h1>
      <div className="space-y-3">
        {pending.map(op => (
          <div key={op.id} className="card flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800">{op.companyName}</p>
              <p className="text-sm text-gray-500">Hotline: {op.hotline} • MSX: {op.licenseNumber}</p>
              <p className="text-sm text-gray-500">{op.address}</p>
            </div>
            <button onClick={() => handleApprove(op.id)} className="btn-primary text-sm py-1.5 px-4">
              ✓ Duyệt
            </button>
          </div>
        ))}
        {pending.length === 0 && (
          <div className="card text-center py-12 text-gray-500">
            <p>Không có nhà xe nào chờ duyệt.</p>
          </div>
        )}
      </div>
    </div>
  );
}
