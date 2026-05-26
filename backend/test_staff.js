const prisma = require('./src/config/prisma');

async function main() {
  const staffs = await prisma.staff.findMany({
    include: { operator: true },
    take: 5
  });
  console.log(`Found ${staffs.length} staffs.`);
  staffs.forEach(s => console.log(s.fullName, 'belongs to', s.operator?.companyName || 'None'));
}
main().catch(console.error).finally(() => prisma.$disconnect());
