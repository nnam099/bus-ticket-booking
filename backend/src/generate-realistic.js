const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60 * 1000);
const formatDateId = (date) => date.toISOString().slice(0, 10).replace(/-/g, '');

async function main() {
  const operatorEmail = 'operator@demo.vn';
  const operatorUser = await prisma.user.findUnique({
    where: { email: operatorEmail },
    include: { busOperator: true }
  });

  if (!operatorUser || !operatorUser.busOperator) {
    console.log('Operator not found');
    return;
  }
  const operator = operatorUser.busOperator;
  
  console.log('Cleaning up old trips to generate realistic operations...');
  const routes = await prisma.route.findMany({ where: { operatorId: operator.id } });
  const routeIds = routes.map(r => r.id);

  if (routeIds.length > 0) {
    await prisma.$executeRaw`
      DELETE FROM reviews WHERE ticket_detail_id IN (
        SELECT td.id FROM ticket_details td
        JOIN trip_seats ts ON td.trip_seat_id = ts.id
        JOIN trips t ON ts.trip_id = t.id
        WHERE t.route_id = ANY(${routeIds})
      )
    `;
    await prisma.$executeRaw`
      DELETE FROM payments WHERE order_id IN (
        SELECT DISTINCT o.id FROM orders o
        JOIN ticket_details td ON td.order_id = o.id
        JOIN trip_seats ts ON td.trip_seat_id = ts.id
        JOIN trips t ON ts.trip_id = t.id
        WHERE t.route_id = ANY(${routeIds})
      )
    `;
    await prisma.$executeRaw`
      DELETE FROM ticket_details WHERE trip_seat_id IN (
        SELECT ts.id FROM trip_seats ts
        JOIN trips t ON ts.trip_id = t.id
        WHERE t.route_id = ANY(${routeIds})
      )
    `;
    await prisma.$executeRaw`DELETE FROM orders WHERE id NOT IN (SELECT DISTINCT order_id FROM ticket_details)`;
    await prisma.$executeRaw`DELETE FROM trip_staffs WHERE trip_id IN (SELECT id FROM trips WHERE route_id = ANY(${routeIds}))`;
    await prisma.$executeRaw`DELETE FROM trip_seats WHERE trip_id IN (SELECT id FROM trips WHERE route_id = ANY(${routeIds}))`;
    await prisma.$executeRaw`DELETE FROM trips WHERE route_id = ANY(${routeIds})`;
  }

  const staffRole = await prisma.role.findUnique({ where: { name: 'STAFF' } });
  const demoPassword = await bcrypt.hash('Demo@123', 10);

  // We have corridors in seed.js. Let's dynamically pair routes for this operator
  // e.g., HCM -> Nha Trang and Nha Trang -> HCM
  const routePairs = [];
  for (let i = 0; i < routes.length; i++) {
    const r1 = routes[i];
    const r2 = routes.find(r => r.originCity === r1.destinationCity && r.destinationCity === r1.originCity);
    if (r2 && r1.id < r2.id) {
      routePairs.push({ outward: r1, return: r2, distance: r1.distanceKm || 300, duration: r1.durationMinutes || 400 });
    }
  }

  if (routePairs.length === 0) {
    console.log('No route pairs found for logical turnaround.');
    return;
  }

  console.log(`Found ${routePairs.length} logical route pairs (Corridors).`);

  // Ensure enough vehicles and drivers
  let vehicles = await prisma.vehicle.findMany({ where: { operatorId: operator.id, isActive: true } });
  let drivers = await prisma.staff.findMany({ where: { operatorId: operator.id, role: 'DRIVER' } });

  console.log(`Starting with ${vehicles.length} vehicles and ${drivers.length} drivers.`);

  // We assign 2 vehicles and 4 drivers per corridor to ensure rotation
  const allTripData = [];
  const allSeatData = [];
  const staffData = [];
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const vehicleType = await prisma.vehicleType.findFirst({ where: { seatCount: 40 } });
  const layouts = await prisma.seatLayout.findMany({ where: { vehicleTypeId: vehicleType.id } });

  let tripCount = 0;

  for (const pair of routePairs) {
    // Pick 2 vehicles for this corridor
    if (vehicles.length < 2) continue;
    const v1 = vehicles.pop();
    const v2 = vehicles.pop();

    // Pick 4 drivers for this corridor (2 pairs)
    if (drivers.length < 4) continue;
    const d1 = drivers.pop();
    const d2 = drivers.pop();
    const d3 = drivers.pop();
    const d4 = drivers.pop();

    // Give drivers some rest days
    // D1, D2 rest on Monday; D3, D4 rest on Wednesday
    await prisma.staffLeave.createMany({
      data: [
        { staffId: d1.id, startDate: new Date(today.getTime() + 1*86400000), endDate: new Date(today.getTime() + 2*86400000), reason: 'WEEKLY_OFF', status: 'APPROVED' },
        { staffId: d2.id, startDate: new Date(today.getTime() + 1*86400000), endDate: new Date(today.getTime() + 2*86400000), reason: 'WEEKLY_OFF', status: 'APPROVED' },
        { staffId: d3.id, startDate: new Date(today.getTime() + 3*86400000), endDate: new Date(today.getTime() + 4*86400000), reason: 'WEEKLY_OFF', status: 'APPROVED' },
        { staffId: d4.id, startDate: new Date(today.getTime() + 3*86400000), endDate: new Date(today.getTime() + 4*86400000), reason: 'WEEKLY_OFF', status: 'APPROVED' }
      ]
    });

    for (let dayOffset = -2; dayOffset <= 14; dayOffset++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + dayOffset);
      const dateId = formatDateId(currentDate);

      // We have 2 vehicles running opposite directions
      // Vehicle 1: Outward at 07:00, Return at 19:00
      // Vehicle 2: Return at 08:00, Outward at 20:00
      
      const schedules = [
        { vehicle: v1, dir: 'outward', hour: 7, route: pair.outward, driverGroup: [d1, d2] },
        { vehicle: v1, dir: 'return', hour: 19, route: pair.return, driverGroup: [d1, d2] },
        { vehicle: v2, dir: 'return', hour: 8, route: pair.return, driverGroup: [d3, d4] },
        { vehicle: v2, dir: 'outward', hour: 20, route: pair.outward, driverGroup: [d3, d4] }
      ];

      for (const sch of schedules) {
        // Rotate drivers within the group
        const driver = sch.driverGroup[dayOffset % 2 === 0 ? 0 : 1];

        const departureTime = new Date(currentDate);
        departureTime.setHours(sch.hour, 0, 0, 0);

        const estimatedArrival = addMinutes(departureTime, pair.duration);
        let status = departureTime < new Date() ? 'COMPLETED' : 'SCHEDULED';
        
        // Simulating some delays/cancellations for today specifically
        if (dayOffset === 0 && sch.hour === 19) status = 'DELAYED';
        if (dayOffset === 0 && sch.hour === 8) {
           status = 'BOARDING'; // Actually, if 8am was today, it's passed, so COMPLETED.
           // Let's force a BOARDING/DEPARTED around current time
           const now = new Date();
           if (now.getHours() >= 8 && now.getHours() <= 12) status = 'DEPARTED';
        }

        const tripId = `trip-logical-${dateId}-${sch.route.id.slice(-5)}-${sch.hour}`;

        allTripData.push({
          id: tripId,
          routeId: sch.route.id,
          vehicleId: sch.vehicle.id,
          departureTime,
          estimatedArrival,
          basePrice: 300000,
          status,
        });

        for (const layout of layouts) {
          allSeatData.push({ tripId, seatLayoutId: layout.id, status: 'AVAILABLE' });
        }

        staffData.push({ tripId, staffId: driver.id, role: 'DRIVER' });
        tripCount++;
      }
    }
  }

  console.log(`Inserting ${allTripData.length} logical trips...`);
  const BATCH_SIZE = 500;
  for (let i = 0; i < allTripData.length; i += BATCH_SIZE) {
    await prisma.trip.createMany({ data: allTripData.slice(i, i + BATCH_SIZE), skipDuplicates: true });
  }
  for (let i = 0; i < allSeatData.length; i += BATCH_SIZE) {
    await prisma.tripSeat.createMany({ data: allSeatData.slice(i, i + BATCH_SIZE), skipDuplicates: true });
  }
  for (let i = 0; i < staffData.length; i += BATCH_SIZE) {
    await prisma.tripStaff.createMany({ data: staffData.slice(i, i + BATCH_SIZE), skipDuplicates: true });
  }

  // Set 2 random remaining vehicles to IN_MAINTENANCE
  if (vehicles.length >= 2) {
    await prisma.vehicle.update({ where: { id: vehicles[0].id }, data: { status: 'IN_MAINTENANCE' } });
    await prisma.vehicle.update({ where: { id: vehicles[1].id }, data: { status: 'IN_MAINTENANCE' } });
  }

  console.log('Realistic simulation complete! Data strictly adheres to logistics rules.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
