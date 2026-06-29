const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const operators = await prisma.busOperator.count();
  const staffs = await prisma.staff.count();
  const drivers = await prisma.staff.count({ where: { role: 'DRIVER' }});
  const vehicles = await prisma.vehicle.count();
  const routes = await prisma.route.count();
  const trips = await prisma.trip.count();
  const tickets = await prisma.ticketDetail.count();
  const users = await prisma.user.count();
  const customers = await prisma.customer.count();
  
  // Specific for Hoàng Long (operator@demo.vn)
  const hlOperator = await prisma.busOperator.findFirst({
    where: { user: { email: 'operator@demo.vn' } }
  });
  
  let hlStats = {};
  if (hlOperator) {
    const hlId = hlOperator.id;
    hlStats = {
      drivers: await prisma.staff.count({ where: { operatorId: hlId, role: 'DRIVER' } }),
      vehicles: await prisma.vehicle.count({ where: { operatorId: hlId } }),
      trips: await prisma.trip.count({ where: { route: { operatorId: hlId } } }),
      routes: await prisma.route.count({ where: { operatorId: hlId } })
    };
  }

  console.log(JSON.stringify({
    global: { operators, staffs, drivers, vehicles, routes, trips, tickets, users, customers },
    hoanglong: hlStats
  }, null, 2));
}

main().finally(() => prisma.$disconnect());
