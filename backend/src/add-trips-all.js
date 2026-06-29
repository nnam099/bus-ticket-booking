const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60 * 1000);
const formatDateId = (date) => date.toISOString().slice(0, 10).replace(/-/g, '');

async function main() {
  const routes = await prisma.route.findMany({
    include: { operator: true }
  });

  const vehicleType = await prisma.vehicleType.findFirst({ where: { seatCount: 40 } });
  const layouts = await prisma.seatLayout.findMany({ where: { vehicleTypeId: vehicleType.id } });
  
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  const allTripData = [];
  const allSeatData = [];
  const staffData = [];

  console.log(`Generating trips for ${routes.length} routes...`);

  // Sinh data cho 7 ngày tới
  for (let day = 0; day < 7; day++) {
    const dateId = formatDateId(currentDate);

    for (const route of routes) {
      if (route.operator.email === 'operator@demo.vn') continue; // Skip Hoang Long (already generated realistically)

      // Random 2 - 4 chuyến một ngày cho mỗi tuyến
      const numTrips = Math.floor(Math.random() * 3) + 2;
      
      const operatorVehicles = await prisma.vehicle.findMany({ where: { operatorId: route.operatorId }, take: numTrips });
      const operatorDrivers = await prisma.staff.findMany({ where: { operatorId: route.operatorId, role: 'DRIVER' }, take: numTrips });

      if (operatorVehicles.length === 0 || operatorDrivers.length === 0) continue;

      for (let t = 0; t < numTrips; t++) {
         const vehicle = operatorVehicles[t % operatorVehicles.length];
         const driver = operatorDrivers[t % operatorDrivers.length];
         
         const hour = Math.floor(Math.random() * 16) + 5; // 5h to 20h
         const minute = Math.random() > 0.5 ? 0 : 30;

         const departureTime = new Date(currentDate);
         departureTime.setHours(hour, minute, 0, 0);

         const estimatedArrival = addMinutes(departureTime, route.durationMinutes || 300);
         const status = departureTime < new Date() ? 'COMPLETED' : 'SCHEDULED';
         const tripId = `trip-all-${dateId}-${route.id.slice(-5)}-${hour}${minute}-${t}`;

         allTripData.push({
           id: tripId,
           routeId: route.id,
           vehicleId: vehicle.id,
           departureTime,
           estimatedArrival,
           basePrice: 350000,
           status,
         });

         for (const layout of layouts) {
           allSeatData.push({
             tripId,
             seatLayoutId: layout.id,
             status: 'AVAILABLE',
           });
         }

         staffData.push({
           tripId,
           staffId: driver.id,
           role: 'DRIVER'
         });
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const BATCH_SIZE = 500;
  console.log(`Inserting ${allTripData.length} trips...`);
  
  for (let i = 0; i < allTripData.length; i += BATCH_SIZE) {
    await prisma.trip.createMany({ data: allTripData.slice(i, i + BATCH_SIZE), skipDuplicates: true });
  }
  for (let i = 0; i < allSeatData.length; i += BATCH_SIZE) {
    await prisma.tripSeat.createMany({ data: allSeatData.slice(i, i + BATCH_SIZE), skipDuplicates: true });
  }
  for (let i = 0; i < staffData.length; i += BATCH_SIZE) {
    await prisma.tripStaff.createMany({ data: staffData.slice(i, i + BATCH_SIZE), skipDuplicates: true });
  }

  console.log(`Successfully added ${allTripData.length} trips across all operators!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
