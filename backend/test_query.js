const prisma = require('./src/config/prisma');

async function main() {
  const trips = await prisma.trip.findMany({
    where: {
      route: {
        operator: {
          isApproved: true,
          user: { isActive: true },
        },
      },
    },
    include: {
      route: { include: { operator: true } },
    }
  });
  console.log(`Found ${trips.length} trips with active operators`);

  const allTrips = await prisma.trip.count();
  console.log(`Total trips: ${allTrips}`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
