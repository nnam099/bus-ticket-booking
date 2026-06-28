const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const vehicles = await prisma.vehicle.findMany({
    include: { trips: { orderBy: { departureTime: 'asc' } } }
  });

  let fixedCount = 0;
  for (const v of vehicles) {
    let lastArrival = new Date(0);
    for (const t of v.trips) {
      if (t.status === 'CANCELLED' || t.status === 'COMPLETED') continue;

      const dep = new Date(t.departureTime);
      const arr = new Date(t.estimatedArrival);
      
      const reqDep = new Date(lastArrival.getTime() + 60 * 60 * 1000); // 1 hour turnaround
      
      if (dep < reqDep) {
        const duration = arr.getTime() - dep.getTime();
        const newDep = new Date(Math.max(dep.getTime(), reqDep.getTime()));
        const newArr = new Date(newDep.getTime() + duration);
        
        await prisma.trip.update({
          where: { id: t.id },
          data: {
            departureTime: newDep,
            estimatedArrival: newArr
          }
        });
        lastArrival = newArr;
        fixedCount++;
      } else {
        lastArrival = arr;
      }
    }
  }
  console.log('Fixed trips: ', fixedCount);
}

fix()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
