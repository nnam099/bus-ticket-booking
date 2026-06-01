import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';

const userTabs = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'CUSTOMER', label: 'Khách hàng' },
  { key: 'STAFF', label: 'Nhân viên' },
  { key: 'BUS_OPERATOR', label: 'Nhà xe' },
  { key: 'ADMIN', label: 'Quản trị viên' },
];

const roleLabels = {
  ADMIN: 'Quản trị viên',
  CUSTOMER: 'Khách hàng',
  STAFF: 'Nhân viên',
  BUS_OPERATOR: 'Nhà xe',
};

const ticketStatusClass = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-green-100 text-green-700',
  CHECKED_IN: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-600',
  REFUNDED: 'bg-purple-100 text-purple-700',
};

const ticketStatusLabels = {
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  CHECKED_IN: 'Đã lên xe',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  REFUNDED: 'Đã hoàn tiền',
};

const paymentStatusLabels = {
  PENDING: 'Chờ xử lý',
  SUCCESS: 'Thành công',
  FAILED: 'Thất bại',
  REFUNDED: 'Đã hoàn tiền',
};

const paymentStatusClass = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  SUCCESS: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-600',
  REFUNDED: 'bg-purple-100 text-purple-700',
};

const tripStatusClass = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  BOARDING: 'bg-yellow-100 text-yellow-700',
  DEPARTED: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  DELAYED: 'bg-orange-100 text-orange-700',
  CANCELLED: 'bg-red-100 text-red-600',
};

const tripStatusLabels = {
  SCHEDULED: 'Theo lịch',
  BOARDING: 'Đang lên xe',
  DEPARTED: 'Đang chạy',
  COMPLETED: 'Hoàn thành',
  DELAYED: 'Trễ giờ',
  CANCELLED: 'Đã hủy',
};

const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
}).format(Number(value || 0));

const formatDateTime = (value) => (value ? new Date(value).toLocaleString('vi-VN') : 'Chưa có');

const getRoles = (user) => user.userRoles?.map(ur => ur.role?.name).filter(Boolean) || [];
const hasRole = (user, role) => getRoles(user).includes(role);

const getDisplayName = (user) =>
  user.customer?.fullName ||
  user.staff?.fullName ||
  user.busOperator?.companyName ||
  user.email ||
  user.phone ||
  'Không có tên';

const getRoleDescription = (user) => {
  if (hasRole(user, 'CUSTOMER')) {
    return `${user.customer?._count?.orders || 0} đơn đặt vé · ${user.customer?._count?.reviews || 0} đánh giá`;
  }
  if (hasRole(user, 'STAFF')) {
    const operatorName = user.staff?.operator?.companyName;
    const operatorText = operatorName ? `Nhà xe: ${operatorName}` : 'Chưa gắn nhà xe';
    return `${user.staff?.role || 'Nhân viên'} · ${operatorText} · ${user.staff?._count?.tripStaffs || 0} chuyến được phân công`;
  }
  if (hasRole(user, 'BUS_OPERATOR')) {
    const status = user.busOperator?.isApproved ? 'Đã duyệt' : 'Chờ duyệt';
    return `${status} · ${user.busOperator?._count?.routes || 0} tuyến · ${user.busOperator?._count?.vehicles || 0} xe`;
  }
  if (hasRole(user, 'ADMIN')) return 'Quản trị hệ thống';
  return 'Tài khoản hệ thống';
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [ticketPanel, setTicketPanel] = useState(null);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [invoicePanel, setInvoicePanel] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [routePanel, setRoutePanel] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    api.get('/admin/users').then(r => setUsers(r.data.data)).catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const tabCounts = useMemo(() => userTabs.reduce((counts, tab) => {
    counts[tab.key] = tab.key === 'ALL' ? users.length : users.filter(user => hasRole(user, tab.key)).length;
    return counts;
  }, {}), [users]);

  const filteredUsers = useMemo(() => (
    activeTab === 'ALL' ? users : users.filter(user => hasRole(user, activeTab))
  ), [activeTab, users]);

  const handleToggle = async (id) => {
    try {
      const res = await api.patch(`/admin/users/${id}/toggle-active`);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: res.data.data.isActive } : u));
    } catch {
      alert('Thao tác thất bại.');
    }
  };

  const handleViewTickets = async (user) => {
    setRoutePanel(null);
    setInvoicePanel(null);
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

  const handleViewInvoices = async (user) => {
    setRoutePanel(null);
    setTicketPanel(null);
    setInvoicePanel({ user, invoices: [] });
    setInvoiceLoading(true);
    try {
      const res = await api.get(`/admin/users/${user.id}/invoices`);
      setInvoicePanel(res.data.data);
    } catch {
      alert('Không tải được danh sách hóa đơn.');
      setInvoicePanel(null);
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleViewRoutes = async (user) => {
    setTicketPanel(null);
    setInvoicePanel(null);
    if (routePanel?.user?.id === user.id) {
      setRoutePanel(null);
      return;
    }
    setRoutePanel({ user, routes: [], assignments: [], type: hasRole(user, 'BUS_OPERATOR') ? 'BUS_OPERATOR' : 'STAFF' });
    setRouteLoading(true);
    try {
      const res = await api.get(`/admin/users/${user.id}/routes`);
      setRoutePanel(res.data.data);
    } catch {
      alert('Không tải được danh sách tuyến/chuyến.');
      setRoutePanel(null);
    } finally {
      setRouteLoading(false);
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
          className="self-start rounded-lg border border-gray-300 px-3 py-1 text-sm text-gray-600 transition hover:bg-gray-50"
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
                        {route?.operator?.companyName || 'Chưa có nhà xe'} · {trip?.vehicle?.licensePlate || 'Chưa gán xe'}
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
                        {payment ? `${payment.method}${payment.gateway ? ` / ${payment.gateway}` : ''} - ${ticketStatusLabels[payment.status] || payment.status}` : ticketStatusLabels[ticket.order?.status] || ticket.order?.status}
                      </p>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`badge ${ticketStatusClass[ticket.status] || 'bg-gray-100 text-gray-700'}`}>
                        {ticketStatusLabels[ticket.status] || ticket.status}
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

  const renderInvoicePanel = () => (
    <div className="card border border-emerald-100 bg-emerald-50/20">
      <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Hóa đơn của {invoicePanel.user?.customer?.fullName || invoicePanel.user?.email || invoicePanel.user?.phone}
          </h2>
          <p className="text-sm text-gray-500">{invoicePanel.user?.email || invoicePanel.user?.phone}</p>
        </div>
        <button
          onClick={() => setInvoicePanel(null)}
          className="self-start rounded-lg border border-gray-300 px-3 py-1 text-sm text-gray-600 transition hover:bg-gray-50"
        >
          Đóng
        </button>
      </div>

      {invoiceLoading ? (
        <div className="py-8 text-center text-gray-500">Đang tải danh sách hóa đơn...</div>
      ) : invoicePanel.invoices.length === 0 ? (
        <div className="py-8 text-center text-gray-500">Người dùng này chưa có hóa đơn nào.</div>
      ) : (
        <div className="mt-4 grid gap-4">
          {invoicePanel.invoices.map((invoice) => {
            const latestPayment = invoice.payments?.[0];
            const firstTicket = invoice.ticketDetails?.[0];
            const trip = firstTicket?.tripSeat?.trip;
            const route = trip?.route;
            const routeName = route ? `${route.originCity} - ${route.destinationCity}` : 'Chưa có tuyến';
            const ticketCount = invoice.ticketDetails?.length || 0;

            return (
              <article key={invoice.id} className="rounded-2xl border border-gray-100 bg-white p-4">
                <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr_auto] lg:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="break-all font-mono text-sm font-black text-gray-900">{invoice.publicCode || invoice.id}</p>
                      <span className={`badge ${ticketStatusClass[invoice.status] || 'bg-gray-100 text-gray-700'}`}>
                        {ticketStatusLabels[invoice.status] || invoice.status}
                      </span>
                    </div>
                    <p className="mt-2 font-semibold text-gray-800">{routeName}</p>
                    <p className="text-xs text-gray-500">
                      {route?.operator?.companyName || 'Chưa có nhà xe'} · Tạo: {formatDateTime(invoice.createdAt)}
                    </p>
                  </div>

                  <div className="text-sm text-gray-700">
                    <p className="font-bold text-brand">{formatCurrency(invoice.totalAmount)}</p>
                    <p className="mt-1 text-xs text-gray-500">{ticketCount} vé trong hóa đơn</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {latestPayment
                        ? `${latestPayment.method}${latestPayment.gateway ? ` / ${latestPayment.gateway}` : ''}`
                        : 'Chưa có giao dịch'}
                    </p>
                  </div>

                  <div className="lg:text-right">
                    <span className={`badge ${paymentStatusClass[latestPayment?.status] || 'bg-gray-100 text-gray-700'}`}>
                      {paymentStatusLabels[latestPayment?.status] || latestPayment?.status || 'Chưa thanh toán'}
                    </span>
                    {latestPayment?.gatewayTxnId && (
                      <p className="mt-2 break-all font-mono text-xs text-gray-500">{latestPayment.gatewayTxnId}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100">
                  <table className="min-w-full divide-y divide-gray-100 text-sm">
                    <thead className="bg-gray-50 text-left text-gray-500">
                      <tr>
                        <th className="px-3 py-2 font-medium">Vé</th>
                        <th className="px-3 py-2 font-medium">Hành khách</th>
                        <th className="px-3 py-2 font-medium">Ghế</th>
                        <th className="px-3 py-2 font-medium">Giá</th>
                        <th className="px-3 py-2 font-medium">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {invoice.ticketDetails?.map((ticket) => (
                        <tr key={ticket.id}>
                          <td className="px-3 py-2">
                            <p className="break-all font-mono text-xs font-semibold text-gray-800">{ticket.publicCode || ticket.id}</p>
                          </td>
                          <td className="px-3 py-2">
                            <p className="font-medium text-gray-800">{ticket.passengerName}</p>
                            <p className="text-xs text-gray-500">{ticket.passengerPhone || 'Không có SĐT'}</p>
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {ticket.tripSeat?.seatLayout?.seatCode || '-'}
                            {ticket.tripSeat?.seatLayout?.floor ? ` / Tầng ${ticket.tripSeat.seatLayout.floor}` : ''}
                          </td>
                          <td className="px-3 py-2 font-semibold text-gray-800">{formatCurrency(ticket.price)}</td>
                          <td className="px-3 py-2">
                            <span className={`badge ${ticketStatusClass[ticket.status] || 'bg-gray-100 text-gray-700'}`}>
                              {ticketStatusLabels[ticket.status] || ticket.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderRoutePanel = () => {
    const owner = routePanel.user;
    const title = routePanel.type === 'BUS_OPERATOR'
      ? `Tuyến của ${owner?.busOperator?.companyName || owner?.email}`
      : `Tuyến/chuyến của ${owner?.staff?.fullName || owner?.email}`;

    return (
      <div className="card border border-orange-100 bg-orange-50/20">
        <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            <p className="text-sm text-gray-500">
              {routePanel.type === 'BUS_OPERATOR'
                ? `${routePanel.routes?.length || 0} tuyến đang quản lý, bao gồm cả chiều đi và chiều về nếu đã tạo.`
                : `${routePanel.assignments?.length || 0} chuyến được phân công trên ${routePanel.routes?.length || 0} tuyến.`}
            </p>
          </div>
          <button
            onClick={() => setRoutePanel(null)}
            className="self-start rounded-lg border border-gray-300 px-3 py-1 text-sm text-gray-600 transition hover:bg-gray-50"
          >
            Đóng
          </button>
        </div>

        {routeLoading ? (
          <div className="py-8 text-center text-gray-500">Đang tải tuyến và chuyến...</div>
        ) : routePanel.routes.length === 0 ? (
          <div className="py-8 text-center text-gray-500">Chưa có tuyến hoặc chuyến nào.</div>
        ) : (
          <div className="mt-4 grid gap-3">
            {routePanel.routes.map((route) => {
              const trips = routePanel.type === 'BUS_OPERATOR'
                ? route.trips || []
                : (route.assignments || []).map(item => ({ ...item.trip, assignmentRole: item.role }));
              return (
                <article key={route.id} className="rounded-2xl border border-gray-100 bg-white p-4">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <p className="break-words font-bold text-gray-900">{route.originCity} → {route.destinationCity}</p>
                      <p className="mt-1 break-words text-sm text-gray-500">
                        {route.originAddress || 'Chưa có điểm đón'} → {route.destinationAddress || 'Chưa có điểm trả'}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        Nhà xe: {route.operator?.companyName || routePanel.user?.busOperator?.companyName || routePanel.user?.staff?.operator?.companyName || '-'}
                      </p>
                    </div>
                    <span className="badge bg-gray-100 text-gray-700">
                      {route._count?.trips ?? trips.length} chuyến
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2">
                    {trips.length === 0 ? (
                      <p className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-500">Chưa có chuyến gần đây.</p>
                    ) : trips.map((trip) => (
                      <div key={trip.id} className="grid gap-2 rounded-xl bg-gray-50 px-3 py-2 text-sm lg:grid-cols-[1.5fr_1fr_1fr_auto] lg:items-center">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800">{formatDateTime(trip.departureTime)}</p>
                          <p className="text-xs text-gray-500">Đến: {formatDateTime(trip.estimatedArrival)}</p>
                        </div>
                        <p className="text-gray-600">
                          {trip.vehicle?.licensePlate || '-'}{trip.vehicle?.vehicleType?.name ? ` · ${trip.vehicle.vehicleType.name}` : ''}
                        </p>
                        <p className="text-gray-600">
                          {routePanel.type === 'STAFF' ? `Vai trò: ${trip.assignmentRole || '-'}` : `Còn ${trip._count?.tripSeats ?? '-'} ghế`}
                        </p>
                        <span className={`badge ${tripStatusClass[trip.status] || 'bg-gray-100 text-gray-700'}`}>{tripStatusLabels[trip.status] || trip.status}</span>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="text-center py-16 text-gray-500">Đang tải...</div>;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý người dùng</h1>
          <p className="mt-1 text-sm text-gray-500">Click nhân viên hoặc nhà xe để xem tuyến/chuyến đang phụ trách.</p>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {userTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setTicketPanel(null);
              setInvoicePanel(null);
              setRoutePanel(null);
            }}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition
              ${activeTab === tab.key ? 'border-brand bg-brand text-white' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            {tab.label} ({tabCounts[tab.key] || 0})
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredUsers.map(u => {
          const roles = getRoles(u);
          const isTicketSelected = ticketPanel?.user?.id === u.id;
          const isInvoiceSelected = invoicePanel?.user?.id === u.id;
          const isRouteSelected = routePanel?.user?.id === u.id;
          const canViewTickets = hasRole(u, 'CUSTOMER') && u.customer;
          const canViewInvoices = canViewTickets;
          const canViewRoutes = hasRole(u, 'STAFF') || hasRole(u, 'BUS_OPERATOR');

          return (
            <div key={u.id} className="space-y-3">
              <div
                role={canViewRoutes ? 'button' : undefined}
                tabIndex={canViewRoutes ? 0 : undefined}
                onClick={() => canViewRoutes && handleViewRoutes(u)}
                onKeyDown={(event) => {
                  if (canViewRoutes && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    handleViewRoutes(u);
                  }
                }}
                className={`card flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between ${canViewRoutes ? 'cursor-pointer hover:border-brand/40' : ''} ${isRouteSelected ? 'border-brand/60' : ''}`}
              >
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-gray-800">{getDisplayName(u)}</p>
                    {roles.map(role => (
                      <span key={role} className="badge bg-gray-100 text-gray-700">{roleLabels[role] || role}</span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">{u.email || u.phone}</p>
                  <p className="text-sm text-gray-500">
                    {getRoleDescription(u)} · Tạo: {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                  {canViewRoutes && (
                    <p className="mt-2 text-xs font-semibold text-brand">
                      {isRouteSelected ? 'Đang xem tuyến/chuyến' : 'Click để xem tuyến/chuyến đi và về'}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3" onClick={(event) => event.stopPropagation()}>
                  <span className={`badge ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {u.isActive ? 'Hoạt động' : 'Bị khóa'}
                  </span>
                  {canViewTickets && (
                    <button
                      onClick={() => handleViewTickets(u)}
                      disabled={ticketLoading && isTicketSelected}
                      className={`rounded-lg border px-3 py-1 text-sm transition disabled:cursor-not-allowed disabled:opacity-70
                        ${isTicketSelected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-blue-300 text-blue-600 hover:bg-blue-50'}`}
                    >
                      {ticketLoading && isTicketSelected ? 'Đang tải...' : 'Xem vé'}
                    </button>
                  )}
                  {canViewInvoices && (
                    <button
                      onClick={() => handleViewInvoices(u)}
                      disabled={invoiceLoading && isInvoiceSelected}
                      className={`rounded-lg border px-3 py-1 text-sm transition disabled:cursor-not-allowed disabled:opacity-70
                        ${isInvoiceSelected ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'}`}
                    >
                      {invoiceLoading && isInvoiceSelected ? 'Đang tải...' : 'Xem hóa đơn'}
                    </button>
                  )}
                  {canViewRoutes && (
                    <button
                      onClick={() => handleViewRoutes(u)}
                      disabled={routeLoading && isRouteSelected}
                      className={`rounded-lg border px-3 py-1 text-sm transition disabled:cursor-not-allowed disabled:opacity-70
                        ${isRouteSelected ? 'border-brand bg-orange-50 text-brand' : 'border-orange-300 text-brand hover:bg-orange-50'}`}
                    >
                      {routeLoading && isRouteSelected ? 'Đang tải...' : 'Xem tuyến'}
                    </button>
                  )}
                  {!roles.includes('ADMIN') && (
                    <button onClick={() => handleToggle(u.id)}
                      className={`rounded-lg border px-3 py-1 text-sm transition
                        ${u.isActive ? 'border-red-300 text-red-600 hover:bg-red-50' : 'border-green-300 text-green-600 hover:bg-green-50'}`}>
                      {u.isActive ? 'Khóa' : 'Mở khóa'}
                    </button>
                  )}
                </div>
              </div>
              {isTicketSelected && renderTicketPanel()}
              {isInvoiceSelected && renderInvoicePanel()}
              {isRouteSelected && renderRoutePanel()}
            </div>
          );
        })}
        {filteredUsers.length === 0 && (
          <div className="card text-center py-12 text-gray-500">
            <p>Không có tài khoản nào trong nhóm này.</p>
          </div>
        )}
      </div>
    </div>
  );
}
