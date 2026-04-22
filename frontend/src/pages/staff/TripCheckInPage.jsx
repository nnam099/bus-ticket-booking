import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { staffAPI, ticketAPI, tripAPI } from '../../services/api';

export default function TripCheckInPage() {
  const { tripId } = useParams();
  const [passengers, setPassengers] = useState([]);
  const [tripStatus, setTripStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  const load = () => staffAPI.getPassengers(tripId).then(r => setPassengers(r.data.data));
  useEffect(() => { load(); }, [tripId]);

  const handleCheckIn = async (ticketId) => {
    try {
      await ticketAPI.checkIn(ticketId);
      setPassengers(prev => prev.map(p => p.id === ticketId ? { ...p, checkedInAt: new Date().toISOString() } : p));
    } catch (err) { alert(err.response?.data?.message || 'Lỗi xác nhận'); }
  };

  const handleUpdateStatus = async (status) => {
    const reason = status === 'CANCELLED' || status === 'DELAYED'
      ? window.prompt('Nhập lý do:') : null;
    if ((status === 'CANCELLED' || status === 'DELAYED') && !reason) return;
    setUpdating(true);
    try {
      await tripAPI.updateStatus(tripId, { status, cancelReason: reason });
      setTripStatus(status);
      alert('Cập nhật trạng thái thành công!');
    } catch (err) { alert(err.response?.data?.message || 'Lỗi'); }
    finally { setUpdating(false); }
  };

  const checkedIn = passengers.filter(p => p.checkedInAt).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Soát vé</h1>
          <p className="text-sm text-gray-500">{checkedIn}/{passengers.length} hành khách đã lên xe</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['BOARDING', 'ON_ROUTE', 'COMPLETED', 'DELAYED', 'CANCELLED'].map(s => (
            <button key={s} disabled={updating} onClick={() => handleUpdateStatus(s)}
              className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-100">
              {s === 'BOARDING' ? '🚏 Lên xe' : s === 'ON_ROUTE' ? '🚌 Khởi hành' :
               s === 'COMPLETED' ? '✅ Hoàn thành' : s === 'DELAYED' ? '⚠️ Trễ' : '❌ Hủy'}
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-200 rounded-full mb-6">
        <div className="h-2 bg-brand rounded-full transition-all"
          style={{ width: passengers.length ? `${(checkedIn / passengers.length) * 100}%` : '0%' }} />
      </div>

      <div className="space-y-3">
        {passengers.map(p => (
          <div key={p.id} className={`card flex items-center justify-between
            ${p.checkedInAt ? 'border-green-200 bg-green-50' : ''}`}>
            <div>
              <p className="font-semibold text-gray-800">{p.passengerName}</p>
              <p className="text-sm text-gray-500">
                Ghế {p.tripSeat?.seatLayout?.seatCode} •{' '}
                {p.passengerPhone || '—'}
              </p>
            </div>
            {p.checkedInAt ? (
              <span className="badge bg-green-100 text-green-700">✓ Đã lên xe</span>
            ) : (
              <button onClick={() => handleCheckIn(p.id)}
                className="btn-primary text-sm py-1.5 px-3">
                Xác nhận
              </button>
            )}
          </div>
        ))}
        {passengers.length === 0 && (
          <div className="card text-center py-12 text-gray-500">
            <p>Không có hành khách nào.</p>
          </div>
        )}
      </div>
    </div>
  );
}
