const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const fixes = [
    { bad: 'HÃ\\s*Ná»™i', good: 'Hà Nội' },
    { bad: 'Quáº£ng Ninh', good: 'Quảng Ninh' },
    { bad: 'Há»“ ChÃ\\s*Minh', good: 'Hồ Chí Minh' },
    { bad: 'Ä\\s*Ã\\s*Láº¡t', good: 'Đà Lạt' },
    { bad: 'Ä\\s*Ã\\s*Náºµng', good: 'Đà Nẵng' }
  ];

  const routes = await prisma.route.findMany();
  for (const route of routes) {
    let newOrigin = route.originCity;
    let newDest = route.destinationCity;
    
    // We can just do a more brute-force check
    if (newOrigin.includes('HÃ') || newOrigin.includes('Ná»™i')) newOrigin = 'Hà Nội';
    if (newDest.includes('HÃ') || newDest.includes('Ná»™i')) newDest = 'Hà Nội';
    
    if (newOrigin.includes('Quáº£ng')) newOrigin = 'Quảng Ninh';
    if (newDest.includes('Quáº£ng')) newDest = 'Quảng Ninh';
    
    if (newOrigin.includes('Há»“') || newOrigin.includes('ChÃ')) newOrigin = 'Hồ Chí Minh';
    if (newDest.includes('Há»“') || newDest.includes('ChÃ')) newDest = 'Hồ Chí Minh';

    if (newOrigin !== route.originCity || newDest !== route.destinationCity) {
      console.log(`Fixing: ${route.originCity} -> ${newOrigin}, ${route.destinationCity} -> ${newDest}`);
      await prisma.route.update({
        where: { id: route.id },
        data: { originCity: newOrigin, destinationCity: newDest }
      });
    }
  }
  console.log('Encoding fix complete');
}

run().catch(console.error).finally(() => prisma.$disconnect());
