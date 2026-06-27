const prisma = require('../config/prisma');
const logger = require('../utils/logger');

/**
 * Báo cáo sự cố
 */
const reportIncident = async (tripId, type, description, severity) => {
  return await prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new Error('Chuyến đi không tồn tại.');

    const incident = await tx.tripIncident.create({
      data: {
        tripId,
        type,
        description,
        severity,
      },
    });

    const updatedTrip = await tx.trip.update({
      where: { id: tripId, version: trip.version },
      data: {
        status: 'DELAYED',
        version: trip.version + 1,
      },
    });

    await tx.tripEventLog.create({
      data: {
        tripId,
        eventType: 'INCIDENT_REPORTED',
        metadata: { incidentId: incident.id, type, severity },
      },
    });

    logger.error(`Incident reported on trip ${tripId}: ${type} - ${description}`);
    return { incident, updatedTrip };
  });
};

/**
 * Đánh dấu đã giải quyết sự cố
 */
const resolveIncident = async (incidentId, actorId) => {
  return await prisma.$transaction(async (tx) => {
    const incident = await tx.tripIncident.findUnique({ where: { id: incidentId } });
    if (!incident) throw new Error('Sự cố không tồn tại.');
    if (incident.resolvedAt) throw new Error('Sự cố đã được giải quyết.');

    const updatedIncident = await tx.tripIncident.update({
      where: { id: incidentId },
      data: { resolvedAt: new Date() },
    });

    await tx.tripEventLog.create({
      data: {
        tripId: incident.tripId,
        eventType: 'INCIDENT_RESOLVED',
        actorId,
        metadata: { incidentId },
      },
    });

    logger.info(`Resolved incident ${incidentId}`);
    return updatedIncident;
  });
};

module.exports = { reportIncident, resolveIncident };
