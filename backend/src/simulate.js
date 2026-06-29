const prisma = require('./config/prisma');

async function simulateOperations() {
  const operatorEmail = 'operator@demo.vn';

  const user = await prisma.user.findUnique({
    where: { email: operatorEmail },
    include: { busOperator: true },
  });

  if (!user || !user.busOperator) {
    console.error('Operator not found');
    return;
  }

  const operatorId = user.busOperator.id;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setHours(23, 59, 59, 999);

  // 1. Set some trips today to BOARDING / DEPARTED / DELAYED / CANCELLED
  const todayTrips = await prisma.trip.findMany({
    where: {
      route: { operatorId },
      departureTime: { gte: todayStart, lte: todayEnd },
    },
    take: 10
  });

  if (todayTrips.length >= 4) {
    await prisma.trip.update({ where: { id: todayTrips[0].id }, data: { status: 'BOARDING' } });
    await prisma.trip.update({ where: { id: todayTrips[1].id }, data: { status: 'DEPARTED' } });
    await prisma.trip.update({ where: { id: todayTrips[2].id }, data: { status: 'DELAYED' } });
    await prisma.trip.update({ where: { id: todayTrips[3].id }, data: { status: 'CANCELLED', cancelReason: 'Weather condition' } });
    console.log('Updated 4 trips to active/delayed/cancelled statuses.');
  }

  // 2. Set some vehicles to IN_MAINTENANCE
  const vehicles = await prisma.vehicle.findMany({
    where: { operatorId, isActive: true },
    take: 2
  });

  if (vehicles.length > 0) {
    for (const v of vehicles) {
      await prisma.vehicle.update({
        where: { id: v.id },
        data: { status: 'IN_MAINTENANCE' }
      });
    }
    console.log(`Updated ${vehicles.length} vehicles to IN_MAINTENANCE.`);
  }

  // 3. Create some StaffLeave for today
  const drivers = await prisma.staff.findMany({
    where: { operatorId, role: 'DRIVER' },
    take: 3
  });

  for (const driver of drivers) {
    // Delete existing leave for today if any to avoid collision
    await prisma.staffLeave.deleteMany({
      where: { staffId: driver.id }
    });

    await prisma.staffLeave.create({
      data: {
        staffId: driver.id,
        startDate: todayStart,
        endDate: todayEnd,
        reason: 'SICK',
        status: 'APPROVED'
      }
    });
  }
  console.log(`Created ${drivers.length} APPROVED leaves for today.`);

  console.log('Simulation complete!');
  process.exit(0);
}

simulateOperations().catch(console.error);
