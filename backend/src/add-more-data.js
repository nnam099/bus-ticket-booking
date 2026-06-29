const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function attachRole(userId, roleId) {
  return prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId } },
    update: {},
    create: { userId, roleId },
  });
}

const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60 * 1000);
const formatDateId = (date) => date.toISOString().slice(0, 10).replace(/-/g, '');

async function main() {
  const operatorEmail = 'operator@demo.vn';
  const operatorUser = await prisma.user.findUnique({
    where: { email: operatorEmail },
    include: { busOperator: true }
  });

  if (!operatorUser || !operatorUser.busOperator) {
    console.log('Operator not found');
    return;
  }

  const operator = operatorUser.busOperator;
  const staffRole = await prisma.role.findUnique({ where: { name: 'STAFF' } });
  const demoPassword = await bcrypt.hash('Demo@123', 10);

  // 1. THÊM 30 TÀI XẾ MỚI
  console.log('Adding 30 new drivers...');
  const newDrivers = [];
  for (let i = 1; i <= 30; i++) {
    const email = `driver.extra.${i}@demo.vn`;
    const phone = `088${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`;
    
    const staffUser = await prisma.user.upsert({
      where: { email },
      update: { isActive: true, isAnonymized: false, phone },
      create: { email, phone, passwordHash: demoPassword },
    });
    
    await attachRole(staffUser.id, staffRole.id);
    
    const driver = await prisma.staff.upsert({
      where: { userId: staffUser.id },
      update: { fullName: `Tài xế Bổ sung ${i}`, role: 'DRIVER', licenseNo: `GPLX-EXTRA-${i}`, phone, operatorId: operator.id },
      create: { userId: staffUser.id, operatorId: operator.id, fullName: `Tài xế Bổ sung ${i}`, role: 'DRIVER', licenseNo: `GPLX-EXTRA-${i}`, phone },
    });
    newDrivers.push(driver);
  }
  console.log('Successfully added 30 drivers.');

  // 2. THÊM 20 XE MỚI
  console.log('Adding 20 new vehicles...');
  const vehicleType = await prisma.vehicleType.findFirst({ where: { seatCount: 40 } });
  if (!vehicleType) {
     console.log('Vehicle type 40 not found');
     return;
  }

  const newVehicles = [];
  for (let i = 1; i <= 20; i++) {
    const v = await prisma.vehicle.upsert({
      where: { licensePlate: `51B-EXTRA${i}` },
      update: { operatorId: operator.id, vehicleTypeId: vehicleType.id, isActive: true },
      create: { 
        id: `veh-extra-${i}`, 
        operatorId: operator.id, 
        vehicleTypeId: vehicleType.id, 
        licensePlate: `51B-EXTRA${i}`, 
        manufactureYear: 2024,
        isActive: true
      },
    });
    newVehicles.push(v);
  }
  console.log('Successfully added 20 vehicles.');

  // 3. THÊM CHUYẾN ĐI TRONG 7 NGÀY TỚI
  console.log('Adding 200 new trips...');
  const routes = await prisma.route.findMany({ where: { operatorId: operator.id } });
  if (routes.length === 0) {
    console.log('No routes found for operator');
    return;
  }

  const layouts = await prisma.seatLayout.findMany({ where: { vehicleTypeId: vehicleType.id } });
  
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  const allTripData = [];
  const allSeatData = [];
  const staffData = [];

  for (let day = 0; day < 7; day++) {
    const dateId = formatDateId(currentDate);

    // Mỗi ngày tạo thêm khoảng 30 chuyến
    for (let t = 0; t < 30; t++) {
       const route = routes[Math.floor(Math.random() * routes.length)];
       const vehicle = newVehicles[Math.floor(Math.random() * newVehicles.length)];
       const driver = newDrivers[Math.floor(Math.random() * newDrivers.length)];
       
       const hour = Math.floor(Math.random() * 16) + 5; // 5h to 20h
       const minute = Math.random() > 0.5 ? 0 : 30;

       const departureTime = new Date(currentDate);
       departureTime.setHours(hour, minute, 0, 0);

       const estimatedArrival = addMinutes(departureTime, route.durationMinutes || 300);
       const status = departureTime < new Date() ? 'COMPLETED' : 'SCHEDULED';
       const tripId = `trip-extra-${dateId}-${hour}${minute}-${t}`;

       allTripData.push({
         id: tripId,
         routeId: route.id,
         vehicleId: vehicle.id,
         departureTime,
         estimatedArrival,
         basePrice: 300000,
         status,
       });

       for (const layout of layouts) {
         allSeatData.push({
           tripId,
           seatLayoutId: layout.id,
           status: 'AVAILABLE',
         });
       }

       staffData.push({
         tripId,
         staffId: driver.id,
         role: 'DRIVER'
       });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  const BATCH_SIZE = 500;
  for (let i = 0; i < allTripData.length; i += BATCH_SIZE) {
    await prisma.trip.createMany({ data: allTripData.slice(i, i + BATCH_SIZE), skipDuplicates: true });
  }
  for (let i = 0; i < allSeatData.length; i += BATCH_SIZE) {
    await prisma.tripSeat.createMany({ data: allSeatData.slice(i, i + BATCH_SIZE), skipDuplicates: true });
  }
  for (let i = 0; i < staffData.length; i += BATCH_SIZE) {
    await prisma.tripStaff.createMany({ data: staffData.slice(i, i + BATCH_SIZE), skipDuplicates: true });
  }

  console.log(`Successfully added ${allTripData.length} trips!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
