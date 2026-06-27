const prisma = require('../config/prisma');
const logger = require('../utils/logger');

/**
 * Gán phương tiện cho chuyến đi
 */
const assignVehicle = async (tripId, vehicleId, actorId) => {
  return await prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({
      where: { id: tripId },
      include: { route: true }
    });
    
    if (!trip) throw new Error('Chuyến đi không tồn tại.');
    if (trip.status !== 'SCHEDULED' && trip.status !== 'ASSIGNED') {
      throw new Error('Chỉ có thể gán xe cho chuyến đi ở trạng thái SCHEDULED hoặc ASSIGNED.');
    }

    const vehicle = await tx.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle || !vehicle.isActive) {
      throw new Error('Phương tiện không khả dụng.');
    }
    
    if (vehicle.operatorId !== trip.route.operatorId) {
      throw new Error('Phương tiện không thuộc nhà xe quản lý tuyến đường này.');
    }

    if (vehicle.status === 'IN_MAINTENANCE') {
      throw new Error('Phương tiện đang được bảo trì.');
    }

    // Vehicle conflict check
    const overlappingTrips = await tx.trip.findFirst({
      where: {
        vehicleId,
        id: { not: tripId },
        status: { in: ['SCHEDULED', 'ASSIGNED', 'BOARDING', 'DEPARTED'] },
        departureTime: { lt: trip.estimatedArrival },
        estimatedArrival: { gt: trip.departureTime }
      }
    });

    if (overlappingTrips) {
      throw new Error('Phương tiện đã được gán cho chuyến đi khác trong khoảng thời gian này.');
    }

    const updatedTrip = await tx.trip.update({
      where: { id: tripId, version: trip.version },
      data: {
        vehicleId,
        status: 'ASSIGNED',
        version: trip.version + 1,
      },
    });

    await tx.tripEventLog.create({
      data: {
        tripId,
        eventType: 'VEHICLE_ASSIGNED',
        actorId,
        metadata: { vehicleId },
      },
    });

    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: 'ASSIGN_VEHICLE',
        resource: 'Trip',
        resourceId: tripId,
        details: { vehicleId }
      }
    });

    logger.info(`Assigned vehicle ${vehicleId} to trip ${tripId}`);
    return updatedTrip;
  });
};

/**
 * Gán nhân viên cho chuyến đi
 */
const assignCrew = async (tripId, staffIds, actorId) => {
  return await prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({ 
      where: { id: tripId },
      include: { route: true }
    });
    if (!trip) throw new Error('Chuyến đi không tồn tại.');
    if (trip.status !== 'SCHEDULED' && trip.status !== 'ASSIGNED') {
      throw new Error('Chỉ có thể gán nhân viên cho chuyến đi ở trạng thái SCHEDULED hoặc ASSIGNED.');
    }

    for (const id of staffIds) {
      const staff = await tx.staff.findUnique({ where: { id } });
      if (!staff || staff.operatorId !== trip.route.operatorId) {
        throw new Error(`Nhân viên ${id} không hợp lệ hoặc không thuộc nhà xe này.`);
      }
      if (staff.status !== 'AVAILABLE') {
        throw new Error(`Nhân viên ${id} hiện không khả dụng.`);
      }

      // Check leave conflicts
      const leave = await tx.staffLeave.findFirst({
        where: {
          staffId: id,
          status: 'APPROVED',
          startDate: { lte: trip.estimatedArrival },
          endDate: { gte: trip.departureTime }
        }
      });
      if (leave) {
        throw new Error(`Nhân viên ${id} đang nghỉ phép trong thời gian này.`);
      }

      // Check driver overlap conflicts
      const overlappingTripStaff = await tx.tripStaff.findFirst({
        where: {
          staffId: id,
          trip: {
            id: { not: tripId },
            status: { in: ['SCHEDULED', 'ASSIGNED', 'BOARDING', 'DEPARTED'] },
            departureTime: { lt: trip.estimatedArrival },
            estimatedArrival: { gt: trip.departureTime }
          }
        }
      });
      
      if (overlappingTripStaff) {
        throw new Error(`Nhân viên ${id} đã được phân công chuyến khác trong thời gian này.`);
      }
    }

    // Xóa staff cũ
    await tx.tripStaff.deleteMany({ where: { tripId } });

    // Tạo staff mới
    const staffRecords = staffIds.map((id, index) => ({
      tripId,
      staffId: id,
      role: index === 0 ? 'DRIVER' : 'ASSISTANT',
    }));

    await tx.tripStaff.createMany({
      data: staffRecords,
    });

    const updatedTrip = await tx.trip.update({
      where: { id: tripId, version: trip.version },
      data: {
        version: trip.version + 1,
        status: trip.vehicleId ? 'ASSIGNED' : 'SCHEDULED'
      }
    });

    await tx.tripEventLog.create({
      data: {
        tripId,
        eventType: 'CREW_ASSIGNED',
        actorId,
        metadata: { staffIds },
      },
    });

    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: 'ASSIGN_CREW',
        resource: 'Trip',
        resourceId: tripId,
        details: { staffIds }
      }
    });

    logger.info(`Assigned crew ${staffIds.join(', ')} to trip ${tripId}`);
    return updatedTrip;
  });
};

/**
 * Phê duyệt khởi hành
 */
const approveDeparture = async (tripId, actorId) => {
  return await prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({ where: { id: tripId }, include: { tripStaffs: true } });
    if (!trip) throw new Error('Chuyến đi không tồn tại.');
    if (trip.status !== 'BOARDING' && trip.status !== 'ASSIGNED') {
      throw new Error('Chuyến đi chưa sẵn sàng để khởi hành.');
    }
    if (!trip.vehicleId) {
      throw new Error('Chuyến đi chưa được phân công xe.');
    }
    if (trip.tripStaffs.length === 0) {
      throw new Error('Chuyến đi chưa được phân công nhân viên.');
    }

    const updatedTrip = await tx.trip.update({
      where: { id: tripId, version: trip.version },
      data: {
        status: 'DEPARTED',
        actualDeparture: new Date(),
        version: trip.version + 1,
      },
    });

    await tx.tripEventLog.create({
      data: {
        tripId,
        eventType: 'DEPARTED',
        actorId,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: 'APPROVE_DEPARTURE',
        resource: 'Trip',
        resourceId: tripId,
      }
    });

    logger.info(`Trip ${tripId} has departed`);
    return updatedTrip;
  });
};

module.exports = { assignVehicle, assignCrew, approveDeparture };
