const prisma = require('../config/prisma');
const logger = require('../utils/logger');
const cronParser = require('cron-parser');

/**
 * Khởi tạo chuyến đi dựa trên Schedule
 */
const generateTripsFromSchedule = async (scheduleId, actorId, daysAhead = 30) => {
  return await prisma.$transaction(async (tx) => {
    const schedule = await tx.schedule.findUnique({ 
      where: { id: scheduleId },
      include: { route: true, exceptions: true }
    });
    
    if (!schedule || !schedule.isActive) {
      throw new Error('Lịch trình không tồn tại hoặc đã bị vô hiệu hóa.');
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    
    if (schedule.endDate && schedule.endDate < endDate) {
      endDate.setTime(schedule.endDate.getTime());
    }

    const options = {
      currentDate: startDate,
      endDate: endDate,
      iterator: true
    };

    let interval;
    try {
      interval = cronParser.parseExpression(schedule.cronRule, options);
    } catch (err) {
      throw new Error(`cronRule không hợp lệ: ${err.message}`);
    }

    const newTrips = [];
    const exceptionDates = schedule.exceptions
      .filter(e => e.action === 'CANCEL')
      .map(e => e.exceptionDate.toDateString());

    // Generate dates
    while (true) {
      try {
        const obj = interval.next();
        const departureTime = obj.value.toDate();
        
        // Skip exceptions
        if (exceptionDates.includes(departureTime.toDateString())) {
          continue;
        }

        const estimatedArrival = new Date(departureTime.getTime() + (schedule.route.durationMinutes || 120) * 60000);

        // Check duplicates
        const exists = await tx.trip.findFirst({
          where: {
            routeId: schedule.routeId,
            departureTime: departureTime
          }
        });

        if (!exists) {
          // Find available vehicle type (default behavior for auto-gen)
          const vehicle = await tx.vehicle.findFirst({
            where: { 
              vehicleTypeId: schedule.vehicleTypeId, 
              operatorId: schedule.route.operatorId,
              isActive: true 
            },
          });

          newTrips.push({
            routeId: schedule.routeId,
            vehicleId: vehicle ? vehicle.id : "00000000-0000-0000-0000-000000000000", // Will need assignment later if no vehicle found, but prisma requires vehicleId if it's not optional. Wait, vehicleId is string! Not nullable. So we MUST have a vehicle. Let's find one or throw.
            // Wait, what if there's no vehicle? We just assign the first one, dispatch will fix it later.
            // Actually, in the Prisma schema `vehicleId` is NOT nullable in Trip. We must provide one.
            departureTime: departureTime,
            estimatedArrival: estimatedArrival,
            basePrice: schedule.basePrice,
            status: 'SCHEDULED',
            version: 1
          });
        }
      } catch (e) {
        break; // No more dates
      }
    }

    if (newTrips.length === 0) {
      return { success: true, count: 0, message: 'Không có chuyến đi mới nào được tạo.' };
    }

    // Since vehicleId must be valid, let's filter out ones without a vehicle
    const validTrips = [];
    for (const trip of newTrips) {
       if (trip.vehicleId === "00000000-0000-0000-0000-000000000000") continue;
       const createdTrip = await tx.trip.create({ data: trip });
       validTrips.push(createdTrip);
       
       await tx.tripEventLog.create({
         data: {
           tripId: createdTrip.id,
           eventType: 'TRIP_GENERATED',
           actorId,
           metadata: { scheduleId }
         }
       });
    }

    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: 'GENERATE_TRIPS',
        resource: 'Schedule',
        resourceId: scheduleId,
        details: { generatedCount: validTrips.length }
      }
    });

    logger.info(`Generated ${validTrips.length} trips for schedule ${scheduleId}`);
    return { success: true, count: validTrips.length };
  });
};

module.exports = { generateTripsFromSchedule };
