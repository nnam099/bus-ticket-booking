const prisma = require('../config/prisma');
const { createNotifications } = require('../services/notification.service');
const { AppError } = require('../middlewares/errorHandler');

const findManagedTrip = async (req, tripId) => {
  if (req.roles?.includes('BUS_OPERATOR')) {
    return prisma.trip.findFirst({
      where: { id: tripId, vehicle: { operator: { userId: req.user.id, isApproved: true } } },
    });
  }

  if (req.roles?.includes('STAFF')) {
    return prisma.trip.findFirst({
      where: { id: tripId, tripStaffs: { some: { staffId: req.user.staff?.id } } },
    });
  }

  return null;
};

const TURNAROUND_MINUTES = 60;

const tripStatusLabels = {
  BOARDING: 'đang mở lên xe',
  DEPARTED: 'đã khởi hành',
  COMPLETED: 'đã hoàn thành',
  DELAYED: 'bị báo trễ',
  CANCELLED: 'đã bị hủy',
};

const searchTrips = async (req, res, next) => {
  try {
    const { origin, destination, date, minPrice, maxPrice, operatorId } = req.query;
    if (!origin || !destination || !date) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập điểm đi, điểm đến và ngày.' });
    }

    const startOfDay = new Date(`${date}T00:00:00+07:00`);
    const endOfDay = new Date(`${date}T23:59:59.999+07:00`);

    const now = new Date();
    const minDepartureTime = startOfDay > now ? startOfDay : now;

    const where = {
      status: { in: ['SCHEDULED', 'BOARDING'] },
      departureTime: { gte: minDepartureTime, lte: endOfDay },
      route: {
        originCity: { contains: origin, mode: 'insensitive' },
        destinationCity: { contains: destination, mode: 'insensitive' },
        isActive: true,
        operator: { isApproved: true, user: { isActive: true } },
      },
    };
    if (operatorId) where.vehicle = { operatorId };
    if (minPrice) where.basePrice = { gte: parseFloat(minPrice) };
    if (maxPrice) where.basePrice = { ...where.basePrice, lte: parseFloat(maxPrice) };

    const trips = await prisma.trip.findMany({
      where,
      include: {
        route: { include: { operator: { select: { companyName: true, hotline: true, logoUrl: true } } } },
        vehicle: { include: { vehicleType: { select: { name: true, seatCount: true } } } },
        _count: { select: { tripSeats: { where: { status: 'AVAILABLE' } } } },
      },
      orderBy: { departureTime: 'asc' },
    });

    res.json({ success: true, data: trips });
  } catch (err) {
    next(err);
  }
};

const getTripById = async (req, res, next) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.id, route: { operator: { isApproved: true, user: { isActive: true } } } },
      include: {
        route: { include: { operator: true } },
        vehicle: { include: { vehicleType: { include: { seatLayouts: true } } } },
        tripSeats: {
          include: { seatLayout: true },
          orderBy: [{ seatLayout: { floor: 'asc' } }, { seatLayout: { row: 'asc' } }, { seatLayout: { col: 'asc' } }],
        },
        tripStaffs: { include: { staff: { select: { fullName: true, role: true } } } },
      },
    });
    if (!trip) return res.status(404).json({ success: false, message: 'Không tìm thấy chuyến xe.' });
    res.json({ success: true, data: trip });
  } catch (err) {
    next(err);
  }
};

const listOperatorTrips = async (req, res, next) => {
  try {
    const operatorId = req.user.busOperator?.id;
    const trips = await prisma.trip.findMany({
      where: { vehicle: { operatorId } },
      include: {
        route: true,
        vehicle: { include: { vehicleType: true } },
        _count: {
          select: {
            tripSeats: { where: { status: 'AVAILABLE' } },
          },
        },
      },
      orderBy: { departureTime: 'desc' },
    });

    res.json({ success: true, data: trips });
  } catch (err) {
    next(err);
  }
};

const createTrip = async (req, res, next) => {
  try {
    const { routeId, vehicleId, departureTime, estimatedArrival, basePrice } = req.body;
    const operatorId = req.user.busOperator?.id;
    const departure = new Date(departureTime);
    const arrival = new Date(estimatedArrival);
    const parsedPrice = Number(basePrice);

    if (Number.isNaN(departure.getTime()) || Number.isNaN(arrival.getTime())) {
      return res.status(400).json({ success: false, message: 'Thời gian chuyến xe không hợp lệ.' });
    }
    if (departure <= new Date()) {
      return res.status(400).json({ success: false, message: 'Giờ khởi hành phải ở tương lai.' });
    }
    if (arrival <= departure) {
      return res.status(400).json({ success: false, message: 'Giờ đến dự kiến phải sau giờ khởi hành.' });
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Giá vé phải lớn hơn 0.' });
    }

    // Verify ownership
    const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, operatorId, isActive: true } });
    if (!vehicle) return res.status(403).json({ success: false, message: 'Xe không thuộc nhà xe của bạn.' });
    const route = await prisma.route.findFirst({ where: { id: routeId, operatorId, isActive: true } });
    if (!route) return res.status(403).json({ success: false, message: 'Tuyến không thuộc nhà xe của bạn.' });
    const trip = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${vehicleId}))`;
      const lockedOverlap = await tx.trip.findFirst({
        where: {
          vehicleId,
          status: { not: 'CANCELLED' },
          departureTime: { lt: new Date(arrival.getTime() + TURNAROUND_MINUTES * 60 * 1000) },
          estimatedArrival: { gt: new Date(departure.getTime() - TURNAROUND_MINUTES * 60 * 1000) },
        },
        select: { id: true },
      });
      if (lockedOverlap) {
        throw new AppError(`Xe đã có chuyến khác trong khung giờ này hoặc chưa đủ ${TURNAROUND_MINUTES} phút quay đầu.`, 409);
      }

      const newTrip = await tx.trip.create({
        data: { routeId, vehicleId, departureTime: departure, estimatedArrival: arrival, basePrice: parsedPrice },
      });

      // Auto-generate trip seats from vehicle seat layout
      const layouts = await tx.seatLayout.findMany({ where: { vehicleTypeId: vehicle.vehicleTypeId } });
      await tx.tripSeat.createMany({
        data: layouts.map((l) => ({ tripId: newTrip.id, seatLayoutId: l.id, status: 'AVAILABLE' })),
      });

      return newTrip;
    });

    res.status(201).json({ success: true, data: trip });
  } catch (err) {
    next(err);
  }
};

const updateTripStatus = async (req, res, next) => {
  try {
    const { status, cancelReason } = req.body;
    const validStatuses = ['SCHEDULED', 'BOARDING', 'DEPARTED', 'COMPLETED', 'DELAYED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ.' });
    }
    if (status === 'CANCELLED' && !cancelReason) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập lý do hủy chuyến.' });
    }

    const managedTrip = await findManagedTrip(req, req.params.id);
    if (!managedTrip) {
      return res.status(403).json({ success: false, message: 'Khong co quyen cap nhat chuyen nay.' });
    }

    const allowedTransitions = {
      SCHEDULED: ['BOARDING', 'DELAYED', 'CANCELLED'],
      DELAYED: ['BOARDING', 'CANCELLED'],
      BOARDING: ['DEPARTED', 'CANCELLED'],
      DEPARTED: ['COMPLETED'],
      COMPLETED: [],
      CANCELLED: [],
    };
    if (managedTrip.status && !allowedTransitions[managedTrip.status]?.includes(status)) {
      return res.status(400).json({ success: false, message: 'Không thể chuyển trạng thái chuyến xe theo thứ tự này.' });
    }

    const trip = await prisma.$transaction(async (tx) => {
      const lockedRows = await tx.$queryRaw`SELECT id FROM "trips" WHERE id = ${req.params.id} FOR UPDATE`;
      if (!lockedRows.length) {
        throw new AppError('Không tìm thấy chuyến xe.', 404);
      }

      const currentTrip = await tx.trip.findUnique({
        where: { id: req.params.id },
        include: { route: true },
      });
      if (currentTrip.status && !allowedTransitions[currentTrip.status]?.includes(status)) {
        throw new AppError('Không thể chuyển trạng thái chuyến xe theo thứ tự này.', 400);
      }

      return tx.trip.update({
        where: { id: req.params.id },
        data: { status, cancelReason: cancelReason || null },
        include: { route: true },
      });
    });

    // If operator cancels trip, auto-refund all paid tickets (QD_OP_03)
    if (status === 'CANCELLED') {
      const paidTickets = await prisma.ticketDetail.findMany({
        where: { tripSeat: { tripId: trip.id }, status: 'PAID' },
      });
      for (const ticket of paidTickets) {
        const claimedTicket = await prisma.ticketDetail.updateMany({
          where: { id: ticket.id, status: 'PAID' },
          data: { status: 'REFUNDED', cancelledAt: new Date() },
        });
        if (claimedTicket.count === 1) {
          await prisma.payment.create({
            data: { orderId: ticket.orderId, amount: -Number(ticket.price), method: 'REFUND', status: 'REFUNDED', refundedAt: new Date(), refundAmount: ticket.price },
          });
        }
      }
    }

    if (status === 'COMPLETED') {
      await prisma.ticketDetail.updateMany({
        where: { tripSeat: { tripId: trip.id }, status: { in: ['PAID', 'CHECKED_IN'] } },
        data: { status: 'COMPLETED' },
      });
    }

    if (['BOARDING', 'DEPARTED', 'COMPLETED', 'DELAYED', 'CANCELLED'].includes(status)) {
      const tickets = await prisma.ticketDetail.findMany({
        where: {
          tripSeat: { tripId: trip.id },
          status: { in: ['PAID', 'CHECKED_IN', 'COMPLETED', 'REFUNDED'] },
        },
        select: {
          id: true,
          order: { select: { customer: { select: { userId: true } } } },
        },
      });
      const uniqueUserIds = [...new Set(tickets.map(ticket => ticket.order.customer.userId).filter(Boolean))];
      await createNotifications(uniqueUserIds.map(userId => ({
        userId,
        title: 'Cập nhật chuyến xe',
        message: `Chuyến ${trip.route.originCity} → ${trip.route.destinationCity} ${tripStatusLabels[status] || 'đã cập nhật trạng thái'}.`,
        type: status === 'CANCELLED' ? 'TRIP_CANCELLED' : 'TRIP_STATUS',
        link: '/my-tickets',
        metadata: { tripId: trip.id, status, cancelReason: cancelReason || null },
      })));
    }

    res.json({ success: true, data: trip });
  } catch (err) {
    next(err);
  }
};

const updateTrip = async (req, res, next) => {
  try {
    const { routeId, vehicleId, departureTime, estimatedArrival, basePrice } = req.body;
    const operatorId = req.user.busOperator?.id;
    const departure = new Date(departureTime);
    const arrival = new Date(estimatedArrival);
    const parsedPrice = Number(basePrice);

    if (Number.isNaN(departure.getTime()) || Number.isNaN(arrival.getTime())) {
      return res.status(400).json({ success: false, message: 'Thời gian chuyến xe không hợp lệ.' });
    }
    if (departure <= new Date()) {
      return res.status(400).json({ success: false, message: 'Giờ khởi hành phải ở tương lai.' });
    }
    if (arrival <= departure) {
      return res.status(400).json({ success: false, message: 'Giờ đến dự kiến phải sau giờ khởi hành.' });
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Giá vé phải lớn hơn 0.' });
    }

    const managedTrip = await prisma.trip.findFirst({
      where: { id: req.params.id, vehicle: { operatorId } },
    });
    if (!managedTrip) return res.status(403).json({ success: false, message: 'Không tìm thấy chuyến xe hoặc không có quyền.' });
    if (!['SCHEDULED', 'DELAYED'].includes(managedTrip.status)) {
      return res.status(400).json({ success: false, message: 'Chỉ có thể chỉnh sửa các chuyến chưa chạy.' });
    }

    const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, operatorId, isActive: true } });
    if (!vehicle) return res.status(403).json({ success: false, message: 'Xe không thuộc nhà xe của bạn.' });

    const updatedTrip = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${vehicleId}))`;
      const lockedOverlap = await tx.trip.findFirst({
        where: {
          id: { not: req.params.id },
          vehicleId,
          status: { not: 'CANCELLED' },
          departureTime: { lt: new Date(arrival.getTime() + TURNAROUND_MINUTES * 60 * 1000) },
          estimatedArrival: { gt: new Date(departure.getTime() - TURNAROUND_MINUTES * 60 * 1000) },
        },
        select: { id: true },
      });
      if (lockedOverlap) {
        throw new AppError(`Xe đã có chuyến khác trong khung giờ này hoặc chưa đủ ${TURNAROUND_MINUTES} phút quay đầu.`, 409);
      }

      return tx.trip.update({
        where: { id: req.params.id },
        data: { routeId, vehicleId, departureTime: departure, estimatedArrival: arrival, basePrice: parsedPrice },
      });
    });

    res.json({ success: true, data: updatedTrip });
  } catch (err) {
    next(err);
  }
};

module.exports = { searchTrips, getTripById, listOperatorTrips, createTrip, updateTripStatus, updateTrip };
