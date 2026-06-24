const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const route = await prisma.route.findFirst({
    where: { originCity: 'Hà Nội', destinationCity: 'Quảng Ninh' },
    include: { trips: { take: 5, orderBy: { departureTime: 'asc' } } }
  });
  console.log('Route:', route ? route.id : 'Not found');
  console.log('Trips count:', route ? route.trips.length : 0);
  if (route) {
    console.log(route.trips.map(t => t.departureTime));
  }
}
run().catch(console.error).finally(() => prisma.$disconnect());
