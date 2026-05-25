// AdminUsersPage.jsx
import { useEffect, useState } from 'react';
import api from '../../services/api';

const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
}).format(Number(value || 0));

const formatDateTime = (value) => (value ? new Date(value).toLocaleString('vi-VN') : 'Chưa có');

const ticketStatusClass = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-green-100 text-green-700',
  CHECKED_IN: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-600',
  REFUNDED: 'bg-purple-100 text-purple-700',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ticketPanel, setTicketPanel] = useState(null);
  const [ticketLoading, setTicketLoading] = useState(false);

  useEffect(() => {
    api.get('/admin/users').then(r => setUsers(r.data.data)).catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (id) => {
    try {
      const res = await api.patch(`/admin/users/${id}/toggle-active`);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: res.data.data.isActive } : u));
    } catch { alert('Thao tác thất bại.'); }
  };

  const handleViewTickets = async (user) => {
    setTicketPanel({ user, tickets: [] });
    setTicketLoading(true);
    try {
      const res = await api.get(`/admin/users/${user.id}/tickets`);
      setTicketPanel(res.data.data);
    } catch {
      alert('Không tải được danh sách vé.');
      setTicketPanel(null);
    } finally {
      setTicketLoading(false);
    }
  };

  const renderTicketPanel = () => (
    <div className="card border border-blue-100 bg-blue-50/20">
      <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Vé đã đặt của {ticketPanel.user?.customer?.fullName || ticketPanel.user?.email || ticketPanel.user?.phone}
          </h2>
          <p className="text-sm text-gray-500">{ticketPanel.user?.email || ticketPanel.user?.phone}</p>
        </div>
        <button
          onClick={() => setTicketPanel(null)}
          className="self-start text-sm px-3 py-1 rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-50"
        >
          Đóng
        </button>
      </div>

      {ticketLoading ? (
        <div className="py-8 text-center text-gray-500">Đang tải danh sách vé...</div>
      ) : ticketPanel.tickets.length === 0 ? (
        <div className="py-8 text-center text-gray-500">Người dùng này chưa đặt vé nào.</div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 pr-4 font-medium">Chuyến</th>
                <th className="py-2 pr-4 font-medium">Khởi hành</th>
                <th className="py-2 pr-4 font-medium">Ghế</th>
                <th className="py-2 pr-4 font-medium">Hành khách</th>
                <th className="py-2 pr-4 font-medium">Thanh toán</th>
                <th className="py-2 pr-4 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ticketPanel.tickets.map((ticket) => {
                const trip = ticket.tripSeat?.trip;
                const route = trip?.route;
                const payment = ticket.order?.payments?.[0];
                const routeName = route ? `${route.originCity} - ${route.destinationCity}` : 'Chưa có tuyến';

                return (
                  <tr key={ticket.id} className="align-top">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-gray-800">{routeName}</p>
                      <p className="text-xs text-gray-500">
                        {route?.operator?.companyName || 'Chưa có nhà xe'} • {trip?.vehicle?.licensePlate || 'Chưa gán xe'}
                      </p>
                    </td>
                    <td className="py-3 pr-4 text-gray-700">
                      <p>{formatDateTime(trip?.departureTime)}</p>
                      <p className="text-xs text-gray-500">Đến: {formatDateTime(trip?.estimatedArrival)}</p>
                    </td>
                    <td className="py-3 pr-4 text-gray-700">
                      {ticket.tripSeat?.seatLayout?.seatCode || 'Chưa có'}
                      {ticket.tripSeat?.seatLayout?.floor ? ` / Tầng ${ticket.tripSeat.seatLayout.floor}` : ''}
                    </td>
                    <td className="py-3 pr-4 text-gray-700">
                      <p>{ticket.passengerName}</p>
                      <p className="text-xs text-gray-500">{ticket.passengerPhone || 'Không có SĐT'}</p>
                    </td>
                    <td className="py-3 pr-4 text-gray-700">
                      <p>{formatCurrency(ticket.price)}</p>
                      <p className="text-xs text-gray-500">
                        {payment ? `${payment.method}${payment.gateway ? ` / ${payment.gateway}` : ''} - ${payment.status}` : ticket.order?.status}
                      </p>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`badge ${ticketStatusClass[ticket.status] || 'bg-gray-100 text-gray-700'}`}>
                        {ticket.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  if (loading) return <div className="text-center py-16 text-gray-500">Đang tải...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Quản lý người dùng</h1>
      <div className="space-y-3">
        {users.map(u => {
          const isSelected = ticketPanel?.user?.id === u.id;

          return (
            <div key={u.id} className="space-y-3">
              <div className="card flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{u.email || u.phone}</p>
                  <p className="text-sm text-gray-500">
                    {u.userRoles?.map(ur => ur.role?.name).join(', ')} •{' '}
                    Tạo: {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {u.isActive ? 'Hoạt động' : 'Bị khóa'}
                  </span>
                  <button
                    onClick={() => handleViewTickets(u)}
                    disabled={ticketLoading && isSelected}
                    className={`text-sm px-3 py-1 rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-70
                      ${isSelected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-blue-300 text-blue-600 hover:bg-blue-50'}`}
                  >
                    {ticketLoading && isSelected ? 'Đang tải...' : 'Xem vé'}
                  </button>
                  <button onClick={() => handleToggle(u.id)}
                    className={`text-sm px-3 py-1 rounded-lg border transition
                      ${u.isActive ? 'border-red-300 text-red-600 hover:bg-red-50' : 'border-green-300 text-green-600 hover:bg-green-50'}`}>
                    {u.isActive ? 'Khóa' : 'Mở khóa'}
                  </button>
                </div>
              </div>
              {isSelected && renderTicketPanel()}
            </div>
          );
        })}
        {users.length === 0 && (
          <div className="card text-center py-12 text-gray-500">
            <p>Không có người dùng nào.</p>
          </div>
        )}
      </div>
    </div>
  );
}
