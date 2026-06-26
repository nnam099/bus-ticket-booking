import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { PageHeader, Card, Badge, Button, EmptyState, Loading, Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui';

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
  PENDING: 'warning',
  PAID: 'success',
  CHECKED_IN: 'info',
  COMPLETED: 'default',
  CANCELLED: 'danger',
  REFUNDED: 'primary',
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
  PENDING: 'warning',
  SUCCESS: 'success',
  FAILED: 'danger',
  REFUNDED: 'primary',
};

const tripStatusClass = {
  SCHEDULED: 'info',
  BOARDING: 'warning',
  DEPARTED: 'success',
  COMPLETED: 'default',
  DELAYED: 'warning',
  CANCELLED: 'danger',
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
    <Card className="border-blue-100 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/10 mt-2" noPadding>
      <div className="p-5 flex flex-col gap-3 border-b border-gray-100 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Vé đã đặt của {ticketPanel.user?.customer?.fullName || ticketPanel.user?.email || ticketPanel.user?.phone}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{ticketPanel.user?.email || ticketPanel.user?.phone}</p>
        </div>
        <Button onClick={() => setTicketPanel(null)} variant="outline" size="sm">Đóng</Button>
      </div>

      {ticketLoading ? (
        <Loading />
      ) : ticketPanel.tickets.length === 0 ? (
        <EmptyState title="Chưa đặt vé nào" description="Người dùng này chưa đặt vé nào." />
      ) : (
        <div className="overflow-x-auto">
          <Table className="border-0 shadow-none rounded-none !bg-transparent">
            <Thead>
              <Tr>
                <Th>Chuyến</Th>
                <Th>Khởi hành</Th>
                <Th>Ghế</Th>
                <Th>Hành khách</Th>
                <Th>Thanh toán</Th>
                <Th>Trạng thái</Th>
              </Tr>
            </Thead>
            <Tbody>
              {ticketPanel.tickets.map((ticket) => {
                const trip = ticket.tripSeat?.trip;
                const route = trip?.route;
                const payment = ticket.order?.payments?.[0];
                const routeName = route ? `${route.originCity} - ${route.destinationCity}` : 'Chưa có tuyến';

                return (
                  <Tr key={ticket.id}>
                    <Td>
                      <p className="font-bold text-gray-900 dark:text-gray-100">{routeName}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {route?.operator?.companyName || 'Chưa có nhà xe'} · {trip?.vehicle?.licensePlate || 'Chưa gán xe'}
                      </p>
                    </Td>
                    <Td>
                      <p className="font-medium">{formatDateTime(trip?.departureTime)}</p>
                      <p className="text-xs text-gray-500 mt-1">Đến: {formatDateTime(trip?.estimatedArrival)}</p>
                    </Td>
                    <Td>
                      <span className="font-bold">{ticket.tripSeat?.seatLayout?.seatCode || 'Chưa có'}</span>
                      {ticket.tripSeat?.seatLayout?.floor ? <span className="text-xs text-gray-500 ml-1">/ Tầng {ticket.tripSeat.seatLayout.floor}</span> : ''}
                    </Td>
                    <Td>
                      <p className="font-medium">{ticket.passengerName}</p>
                      <p className="text-xs text-gray-500 mt-1">{ticket.passengerPhone || 'Không có SĐT'}</p>
                    </Td>
                    <Td>
                      <p className="font-bold text-[#e85d04]">{formatCurrency(ticket.price)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {payment ? `${payment.method}${payment.gateway ? ` / ${payment.gateway}` : ''} - ${ticketStatusLabels[payment.status] || payment.status}` : ticketStatusLabels[ticket.order?.status] || ticket.order?.status}
                      </p>
                    </Td>
                    <Td>
                      <Badge variant={ticketStatusClass[ticket.status] || 'default'}>
                        {ticketStatusLabels[ticket.status] || ticket.status}
                      </Badge>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </div>
      )}
    </Card>
  );

  const renderInvoicePanel = () => (
    <Card className="border-emerald-100 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-900/10 mt-2" noPadding>
      <div className="p-5 flex flex-col gap-3 border-b border-gray-100 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Hóa đơn của {invoicePanel.user?.customer?.fullName || invoicePanel.user?.email || invoicePanel.user?.phone}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{invoicePanel.user?.email || invoicePanel.user?.phone}</p>
        </div>
        <Button onClick={() => setInvoicePanel(null)} variant="outline" size="sm">Đóng</Button>
      </div>

      {invoiceLoading ? (
        <Loading />
      ) : invoicePanel.invoices.length === 0 ? (
        <EmptyState title="Chưa có hóa đơn nào" description="Người dùng này chưa có hóa đơn nào." />
      ) : (
        <div className="p-5 grid gap-4">
          {invoicePanel.invoices.map((invoice) => {
            const latestPayment = invoice.payments?.[0];
            const firstTicket = invoice.ticketDetails?.[0];
            const trip = firstTicket?.tripSeat?.trip;
            const route = trip?.route;
            const routeName = route ? `${route.originCity} - ${route.destinationCity}` : 'Chưa có tuyến';
            const ticketCount = invoice.ticketDetails?.length || 0;

            return (
              <div key={invoice.id} className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
                <div className="p-4 grid gap-3 lg:grid-cols-[1.3fr_1fr_auto] lg:items-start bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-700">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="break-all font-mono text-sm font-black text-gray-900 dark:text-gray-100">{invoice.publicCode || invoice.id}</p>
                      <Badge variant={ticketStatusClass[invoice.status] || 'default'}>
                        {ticketStatusLabels[invoice.status] || invoice.status}
                      </Badge>
                    </div>
                    <p className="mt-2 font-semibold text-gray-800 dark:text-gray-200">{routeName}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {route?.operator?.companyName || 'Chưa có nhà xe'} · Tạo: {formatDateTime(invoice.createdAt)}
                    </p>
                  </div>

                  <div className="text-sm">
                    <p className="font-bold text-[#e85d04] text-lg">{formatCurrency(invoice.totalAmount)}</p>
                    <p className="mt-1 text-xs font-semibold text-gray-500">{ticketCount} vé trong hóa đơn</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {latestPayment
                        ? `${latestPayment.method}${latestPayment.gateway ? ` / ${latestPayment.gateway}` : ''}`
                        : 'Chưa có giao dịch'}
                    </p>
                  </div>

                  <div className="lg:text-right">
                    <Badge variant={paymentStatusClass[latestPayment?.status] || 'default'}>
                      {paymentStatusLabels[latestPayment?.status] || latestPayment?.status || 'Chưa thanh toán'}
                    </Badge>
                    {latestPayment?.gatewayTxnId && (
                      <p className="mt-2 break-all font-mono text-[10px] text-gray-400">{latestPayment.gatewayTxnId}</p>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table className="border-0 shadow-none rounded-none !bg-transparent">
                    <Thead>
                      <Tr>
                        <Th>Vé</Th>
                        <Th>Hành khách</Th>
                        <Th>Ghế</Th>
                        <Th>Giá</Th>
                        <Th>Trạng thái</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {invoice.ticketDetails?.map((ticket) => (
                        <Tr key={ticket.id}>
                          <Td>
                            <p className="break-all font-mono text-xs font-bold text-gray-800 dark:text-gray-300">{ticket.publicCode || ticket.id}</p>
                          </Td>
                          <Td>
                            <p className="font-medium text-gray-800 dark:text-gray-200">{ticket.passengerName}</p>
                            <p className="text-xs text-gray-500">{ticket.passengerPhone || 'Không có SĐT'}</p>
                          </Td>
                          <Td>
                            <span className="font-bold">{ticket.tripSeat?.seatLayout?.seatCode || '-'}</span>
                            {ticket.tripSeat?.seatLayout?.floor ? <span className="text-xs text-gray-500 ml-1">/ Tầng {ticket.tripSeat.seatLayout.floor}</span> : ''}
                          </Td>
                          <Td className="font-bold text-gray-900 dark:text-gray-100">{formatCurrency(ticket.price)}</Td>
                          <Td>
                            <Badge variant={ticketStatusClass[ticket.status] || 'default'}>
                              {ticketStatusLabels[ticket.status] || ticket.status}
                            </Badge>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );

  const renderRoutePanel = () => {
    const owner = routePanel.user;
    const title = routePanel.type === 'BUS_OPERATOR'
      ? `Tuyến của ${owner?.busOperator?.companyName || owner?.email}`
      : `Tuyến/chuyến của ${owner?.staff?.fullName || owner?.email}`;

    return (
      <Card className="border-orange-100 dark:border-[#e85d04]/20 bg-orange-50/50 dark:bg-[#e85d04]/10 mt-2" noPadding>
        <div className="p-5 flex flex-col gap-3 border-b border-gray-100 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {routePanel.type === 'BUS_OPERATOR'
                ? `${routePanel.routes?.length || 0} tuyến đang quản lý, bao gồm cả chiều đi và chiều về nếu đã tạo.`
                : `${routePanel.assignments?.length || 0} chuyến được phân công trên ${routePanel.routes?.length || 0} tuyến.`}
            </p>
          </div>
          <Button onClick={() => setRoutePanel(null)} variant="outline" size="sm">Đóng</Button>
        </div>

        {routeLoading ? (
          <Loading />
        ) : routePanel.routes.length === 0 ? (
          <EmptyState title="Chưa có tuyến hoặc chuyến nào" description="Không có dữ liệu tuyến hoặc chuyến được tìm thấy." />
        ) : (
          <div className="p-5 grid gap-4">
            {routePanel.routes.map((route) => {
              const trips = routePanel.type === 'BUS_OPERATOR'
                ? route.trips || []
                : (route.assignments || []).map(item => ({ ...item.trip, assignmentRole: item.role }));
              return (
                <div key={route.id} className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between pb-4 border-b border-gray-100 dark:border-slate-700">
                    <div className="min-w-0">
                      <p className="break-words font-black text-gray-900 dark:text-white text-lg">{route.originCity} → {route.destinationCity}</p>
                      <p className="mt-1 break-words text-sm text-gray-500 dark:text-gray-400">
                        {route.originAddress || 'Chưa có điểm đón'} → {route.destinationAddress || 'Chưa có điểm trả'}
                      </p>
                      <p className="mt-1.5 text-xs font-semibold text-[#e85d04]">
                        Nhà xe: {route.operator?.companyName || routePanel.user?.busOperator?.companyName || routePanel.user?.staff?.operator?.companyName || '-'}
                      </p>
                    </div>
                    <Badge variant="default" className="text-sm px-3 py-1.5">
                      {route._count?.trips ?? trips.length} chuyến
                    </Badge>
                  </div>

                  <div className="mt-4 grid gap-3">
                    {trips.length === 0 ? (
                      <p className="text-sm font-medium text-gray-500 text-center py-4">Chưa có chuyến gần đây.</p>
                    ) : trips.map((trip) => (
                      <div key={trip.id} className="grid gap-3 rounded-xl bg-gray-50/80 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700 px-4 py-3 text-sm lg:grid-cols-[1.5fr_1fr_1fr_auto] lg:items-center">
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 dark:text-gray-100">{formatDateTime(trip.departureTime)}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Đến: {formatDateTime(trip.estimatedArrival)}</p>
                        </div>
                        <p className="font-medium text-gray-700 dark:text-gray-300">
                          {trip.vehicle?.licensePlate || '-'}{trip.vehicle?.vehicleType?.name ? ` · ${trip.vehicle.vehicleType.name}` : ''}
                        </p>
                        <p className="font-medium text-gray-700 dark:text-gray-300">
                          {routePanel.type === 'STAFF' ? `Vai trò: ${trip.assignmentRole || '-'}` : `Còn ${trip._count?.tripSeats ?? '-'} ghế`}
                        </p>
                        <Badge variant={tripStatusClass[trip.status] || 'default'}>{tripStatusLabels[trip.status] || trip.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    );
  };

  if (loading) return <Loading fullScreen />;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Quản lý người dùng" 
        description="Click nhân viên hoặc nhà xe để xem tuyến/chuyến đang phụ trách." 
      />

      <div className="flex flex-wrap gap-3 mb-6">
        {userTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setTicketPanel(null);
              setInvoicePanel(null);
              setRoutePanel(null);
            }}
            className={`rounded-full px-5 py-2 text-sm font-bold transition-all shadow-sm ${activeTab === tab.key ? 'bg-[#e85d04] text-white shadow-[0_4px_12px_rgba(232,93,4,0.3)]' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:border-[#e85d04] hover:text-[#e85d04]'}`}
          >
            {tab.label} ({tabCounts[tab.key] || 0})
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredUsers.map(u => {
          const roles = getRoles(u);
          const isTicketSelected = ticketPanel?.user?.id === u.id;
          const isInvoiceSelected = invoicePanel?.user?.id === u.id;
          const isRouteSelected = routePanel?.user?.id === u.id;
          const canViewTickets = hasRole(u, 'CUSTOMER') && u.customer;
          const canViewInvoices = canViewTickets;
          const canViewRoutes = hasRole(u, 'STAFF') || hasRole(u, 'BUS_OPERATOR');

          return (
            <div key={u.id} className="space-y-4">
              <Card 
                hover={canViewRoutes}
                className={`flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between ${canViewRoutes ? 'cursor-pointer' : ''} ${isRouteSelected ? 'border-[#e85d04] shadow-md' : ''}`}
                onClick={() => canViewRoutes && handleViewRoutes(u)}
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <p className="font-black text-gray-900 dark:text-white text-lg">{getDisplayName(u)}</p>
                    {roles.map(role => (
                      <Badge key={role} variant="default">{roleLabels[role] || role}</Badge>
                    ))}
                  </div>
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">{u.email || u.phone}</p>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {getRoleDescription(u)} · Tạo: {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                  {canViewRoutes && (
                    <p className="mt-2 text-xs font-bold text-[#e85d04]">
                      {isRouteSelected ? 'Đang xem tuyến/chuyến' : 'Click để xem tuyến/chuyến đi và về'}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 lg:justify-end" onClick={(event) => event.stopPropagation()}>
                  <Badge variant={u.isActive ? 'success' : 'danger'}>
                    {u.isActive ? 'Hoạt động' : 'Bị khóa'}
                  </Badge>
                  
                  {canViewTickets && (
                    <Button
                      onClick={() => handleViewTickets(u)}
                      disabled={ticketLoading && isTicketSelected}
                      variant={isTicketSelected ? 'primary' : 'outline'}
                      size="sm"
                    >
                      {ticketLoading && isTicketSelected ? 'Đang tải...' : 'Xem vé'}
                    </Button>
                  )}
                  {canViewInvoices && (
                    <Button
                      onClick={() => handleViewInvoices(u)}
                      disabled={invoiceLoading && isInvoiceSelected}
                      variant={isInvoiceSelected ? 'primary' : 'outline'}
                      size="sm"
                    >
                      {invoiceLoading && isInvoiceSelected ? 'Đang tải...' : 'Xem hóa đơn'}
                    </Button>
                  )}
                  {canViewRoutes && (
                    <Button
                      onClick={() => handleViewRoutes(u)}
                      disabled={routeLoading && isRouteSelected}
                      variant={isRouteSelected ? 'primary' : 'outline'}
                      size="sm"
                    >
                      {routeLoading && isRouteSelected ? 'Đang tải...' : 'Xem tuyến'}
                    </Button>
                  )}
                  {!roles.includes('ADMIN') && (
                    <Button 
                      onClick={() => handleToggle(u.id)}
                      variant={u.isActive ? 'danger' : 'outline'}
                      size="sm"
                    >
                      {u.isActive ? 'Khóa' : 'Mở khóa'}
                    </Button>
                  )}
                </div>
              </Card>
              {isTicketSelected && renderTicketPanel()}
              {isInvoiceSelected && renderInvoicePanel()}
              {isRouteSelected && renderRoutePanel()}
            </div>
          );
        })}
        {filteredUsers.length === 0 && (
          <EmptyState title="Không có tài khoản nào" description="Không có tài khoản nào trong nhóm này." />
        )}
      </div>
    </div>
  );
}
