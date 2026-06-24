const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const routes = await prisma.route.findMany({
    include: {
      trips: {
        where: {
          departureTime: { gte: new Date() }
        },
        take: 1
      }
    }
  });

  let weirdEncodingCount = 0;
  let missingTripsCount = 0;
  
  // Basic regex to find strange characters like Ã, »™, etc. (common UTF-8 Mojibake)
  const mojibakeRegex = /[ÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ]/;

  for (const route of routes) {
    let hasWeird = false;
    if (mojibakeRegex.test(route.originCity) || mojibakeRegex.test(route.destinationCity)) {
      hasWeird = true;
      weirdEncodingCount++;
      console.log(`[WARN] Possible encoding issue in Route ${route.id}: ${route.originCity} -> ${route.destinationCity}`);
    }
    
    if (route.trips.length === 0) {
      missingTripsCount++;
      console.log(`[WARN] No upcoming trips for Route: ${route.originCity} -> ${route.destinationCity}`);
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Total Routes: ${routes.length}`);
  console.log(`Routes with weird encoding: ${weirdEncodingCount}`);
  console.log(`Routes missing upcoming trips: ${missingTripsCount}`);
  
  if (weirdEncodingCount === 0 && missingTripsCount === 0) {
    console.log("ALL OK! All routes are clean and have upcoming trips.");
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
