const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const routes = await prisma.route.findMany({
    select: { originCity: true, destinationCity: true, trips: { select: { id: true }, take: 1 } }
  });
  console.log(routes.map(r => r.originCity + ' -> ' + r.destinationCity + ' (trips: ' + r.trips.length + ')').join('\n'));
}
run().catch(console.error).finally(() => prisma.$disconnect());
