const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tickets = await prisma.ticketDetail.findMany({ select: { id: true, orderId: true } });
  
  let backdated = 0;
  for (let i = 0; i < tickets.length; i++) {
    // Modify around 80% of the tickets to be in the past
    if (Math.random() < 0.8) {
      const randomDaysAgo = Math.floor(Math.random() * 20) + 1; // 1 to 20 days ago
      const newDate = new Date();
      newDate.setDate(newDate.getDate() - randomDaysAgo);
      newDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

      await prisma.ticketDetail.update({
        where: { id: tickets[i].id },
        data: { createdAt: newDate }
      });
      await prisma.order.update({
        where: { id: tickets[i].orderId },
        data: { createdAt: newDate }
      });
      backdated++;
    }
  }
  console.log(`Successfully backdated ${backdated} out of ${tickets.length} tickets to earlier this month.`);
}

main().finally(() => prisma.$disconnect());
