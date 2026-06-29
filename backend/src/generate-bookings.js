const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Generating random ticket bookings...');

  // Lấy danh sách chuyến đi của ngày hôm nay và ngày qua
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowEnd = new Date(todayStart);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 2);

  const trips = await prisma.trip.findMany({
    where: { departureTime: { gte: todayStart, lte: tomorrowEnd } },
    take: 100, // Lấy 100 chuyến gần nhất
    include: { route: true }
  });

  if (trips.length === 0) {
    console.log('No trips found for booking generation.');
    return;
  }

  // Lấy danh sách khách hàng
  const customers = await prisma.customer.findMany({ take: 10 });
  if (customers.length === 0) {
     console.log('No customers found. Cannot generate tickets.');
     return;
  }

  let totalTickets = 0;
  let totalRevenue = 0;

  for (const trip of trips) {
    // Random 1-5 ghế cho mỗi chuyến
    const numSeats = Math.floor(Math.random() * 5) + 1;
    
    const availableSeats = await prisma.tripSeat.findMany({
      where: { tripId: trip.id, status: 'AVAILABLE' },
      take: numSeats,
      include: { seatLayout: true }
    });

    if (availableSeats.length === 0) continue;

    const customer = customers[Math.floor(Math.random() * customers.length)];
    const orderId = `ord-gen-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const totalAmount = trip.basePrice * availableSeats.length;

    // Create Order
    const order = await prisma.order.create({
      data: {
        id: orderId,
        customerId: customer.id,
        totalAmount,
        status: 'PAID',
        createdAt: new Date(),
      }
    });

    // Create Payment
    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: totalAmount,
        method: 'E_WALLET',
        gateway: 'VNPAY',
        status: 'SUCCESS',
        gatewayTxnId: `VNPAY${Date.now()}`,
      }
    });

    // Create Ticket Details
    for (const seat of availableSeats) {
      // Update seat status
      await prisma.tripSeat.update({
        where: { id: seat.id },
        data: { status: 'BOOKED' }
      });

      // Create ticket
      await prisma.ticketDetail.create({
        data: {
          id: `tkt-gen-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          orderId: order.id,
          tripSeatId: seat.id,
          passengerName: customer.fullName || 'Khách hàng',
          passengerPhone: '0901234567',
          price: trip.basePrice,
          status: 'PAID',
        }
      });
      totalTickets++;
      totalRevenue += Number(trip.basePrice);
    }
  }

  console.log(`Successfully generated ${totalTickets} tickets across various trips.`);
  console.log(`Total Revenue Generated: ${totalRevenue.toLocaleString('vi-VN')} VND`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
