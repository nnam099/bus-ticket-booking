const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60 * 1000);
const formatDateId = (date) => date.toISOString().slice(0, 10).replace(/-/g, '');

async function main() {
  console.log('Generating trips for routes that have no trips...');
  const routesWithoutTrips = await prisma.route.findMany({
    where: { trips: { none: {} } }
  });

  if (routesWithoutTrips.length === 0) {
    console.log('All routes have trips. Nothing to do.');
    return;
  }

  console.log(`Found ${routesWithoutTrips.length} routes without trips. Generating...`);

  const vehicles = await prisma.vehicle.findMany({ include: { vehicleType: true } });
  if (vehicles.length === 0) throw new Error("No vehicles found");
  
  const drivers = await prisma.staff.findMany({ where: { role: 'DRIVER' } });
  if (drivers.length === 0) throw new Error("No drivers found");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const BATCH_SIZE = 500;
  let allTripData = [];
  let allSeatData = [];
  let staffData = [];
  let tripCount = 0;

  for (let i = 0; i < routesWithoutTrips.length; i++) {
    const route = routesWithoutTrips[i];
    const vehicle = vehicles[i % vehicles.length]; // cycle through vehicles
    const driver = drivers[i % drivers.length];
    
    const layouts = await prisma.seatLayout.findMany({ where: { vehicleTypeId: vehicle.vehicleTypeId } });

    // Generate trips for next 30 days
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const serviceDate = new Date(today);
      serviceDate.setDate(today.getDate() + dayOffset);
      const dateId = formatDateId(serviceDate);

      // Create 2 trips per day
      const times = ['08:00', '16:00'];
      for (const time of times) {
        const [hour, minute] = time.split(':').map(Number);
        const departureTime = new Date(serviceDate);
        departureTime.setHours(hour, minute, 0, 0);
        
        const durationMinutes = route.durationMinutes || 120;
        const estimatedArrival = addMinutes(departureTime, durationMinutes);
        const status = departureTime < new Date() ? 'COMPLETED' : 'SCHEDULED';
        
        // short random string to avoid duplicate ID
        const rnd = Math.random().toString(36).substring(2, 6);
        const tripId = `trip-auto-${route.id}-${dateId}-${time.replace(':', '')}-${rnd}`;

        allTripData.push({
          id: tripId,
          routeId: route.id,
          vehicleId: vehicle.id,
          departureTime,
          estimatedArrival,
          basePrice: 250000,
          status,
        });

        for (const layout of layouts) {
          allSeatData.push({
            tripId: tripId,
            seatLayoutId: layout.id,
            status: 'AVAILABLE',
          });
        }

        staffData.push({
          tripId: tripId,
          staffId: driver.id,
          role: 'DRIVER'
        });
      }
    }
  }

  console.log(`Inserting ${allTripData.length} trips...`);
  for (let i = 0; i < allTripData.length; i += BATCH_SIZE) {
    await prisma.trip.createMany({ data: allTripData.slice(i, i + BATCH_SIZE), skipDuplicates: true });
  }

  console.log(`Inserting ${allSeatData.length} seats...`);
  for (let i = 0; i < allSeatData.length; i += BATCH_SIZE) {
    await prisma.tripSeat.createMany({ data: allSeatData.slice(i, i + BATCH_SIZE), skipDuplicates: true });
  }

  console.log(`Inserting ${staffData.length} staffs...`);
  for (let i = 0; i < staffData.length; i += BATCH_SIZE) {
    await prisma.tripStaff.createMany({ data: staffData.slice(i, i + BATCH_SIZE), skipDuplicates: true });
  }

  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
