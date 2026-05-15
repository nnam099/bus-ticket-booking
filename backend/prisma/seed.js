const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60 * 1000);

const formatDateId = (date) => date.toISOString().slice(0, 10).replace(/-/g, '');

async function upsertRole(name, description) {
  return prisma.role.upsert({
    where: { name },
    update: { description },
    create: { name, description },
  });
}

async function attachRole(userId, roleId) {
  return prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId } },
    update: {},
    create: { userId, roleId },
  });
}

async function seedSeatLayouts(vehicleTypeId, seats) {
  for (const seat of seats) {
    await prisma.seatLayout.upsert({
      where: { vehicleTypeId_seatCode: { vehicleTypeId, seatCode: seat.seatCode } },
      update: seat,
      create: { vehicleTypeId, ...seat },
    });
  }
}

function limousine22Seats() {
  const seats = [];
  for (let row = 1; row <= 11; row += 1) {
    seats.push({ seatCode: `A${row}`, floor: 1, row, col: 1, seatType: 'SINGLE' });
    seats.push({ seatCode: `B${row}`, floor: 1, row, col: 2, seatType: 'SINGLE' });
  }
  return seats;
}

function sleeper40Seats() {
  const seats = [];
  for (let floor = 1; floor <= 2; floor += 1) {
    for (let row = 1; row <= 10; row += 1) {
      seats.push({ seatCode: `${floor === 1 ? 'A' : 'C'}${row}`, floor, row, col: 1, seatType: 'SINGLE' });
      seats.push({ seatCode: `${floor === 1 ? 'B' : 'D'}${row}`, floor, row, col: 2, seatType: 'SINGLE' });
    }
  }
  return seats;
}

async function ensureTripSeats(tripId, vehicleTypeId) {
  const layouts = await prisma.seatLayout.findMany({
    where: { vehicleTypeId },
    select: { id: true },
  });

  await prisma.tripSeat.createMany({
    data: layouts.map((layout) => ({
      tripId,
      seatLayoutId: layout.id,
      status: 'AVAILABLE',
    })),
    skipDuplicates: true,
  });
}

async function main() {
  console.log('Starting seed...');

  const [adminRole, customerRole, operatorRole, staffRole] = await Promise.all([
    upsertRole('ADMIN', 'Quan tri he thong'),
    upsertRole('CUSTOMER', 'Khach hang'),
    upsertRole('BUS_OPERATOR', 'Nha xe'),
    upsertRole('STAFF', 'Nhan vien / Tai xe'),
  ]);

  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const demoPassword = await bcrypt.hash('Demo@123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@busticket.vn' },
    update: { isActive: true, isAnonymized: false },
    create: {
      email: 'admin@busticket.vn',
      phone: '0900000001',
      passwordHash: adminPassword,
    },
  });
  await attachRole(adminUser.id, adminRole.id);

  const operatorUser = await prisma.user.upsert({
    where: { email: 'operator@demo.vn' },
    update: { isActive: true, isAnonymized: false },
    create: {
      email: 'operator@demo.vn',
      phone: '0900000002',
      passwordHash: demoPassword,
    },
  });
  await attachRole(operatorUser.id, operatorRole.id);

  const operator = await prisma.busOperator.upsert({
    where: { userId: operatorUser.id },
    update: {
      companyName: 'Demo Express',
      hotline: '1900 1234',
      address: '123 Le Loi, Quan 1, TP. Ho Chi Minh',
      description: 'Nha xe demo dung cho moi truong development.',
      isApproved: true,
      approvedAt: new Date(),
      approvedBy: adminUser.id,
    },
    create: {
      userId: operatorUser.id,
      companyName: 'Demo Express',
      licenseNumber: 'NX-DEMO-001',
      hotline: '1900 1234',
      address: '123 Le Loi, Quan 1, TP. Ho Chi Minh',
      description: 'Nha xe demo dung cho moi truong development.',
      isApproved: true,
      approvedAt: new Date(),
      approvedBy: adminUser.id,
    },
  });

  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@demo.vn' },
    update: { isActive: true, isAnonymized: false },
    create: {
      email: 'customer@demo.vn',
      phone: '0900000003',
      passwordHash: demoPassword,
    },
  });
  await attachRole(customerUser.id, customerRole.id);
  await prisma.customer.upsert({
    where: { userId: customerUser.id },
    update: { fullName: 'Nguyen Van Demo' },
    create: { userId: customerUser.id, fullName: 'Nguyen Van Demo' },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: 'driver@demo.vn' },
    update: { isActive: true, isAnonymized: false },
    create: {
      email: 'driver@demo.vn',
      phone: '0900000004',
      passwordHash: demoPassword,
    },
  });
  await attachRole(staffUser.id, staffRole.id);
  const driver = await prisma.staff.upsert({
    where: { userId: staffUser.id },
    update: {
      fullName: 'Tran Van Tai',
      role: 'DRIVER',
      licenseNo: 'GPLX-DEMO-001',
      phone: '0900000004',
    },
    create: {
      userId: staffUser.id,
      operatorId: operator.id,
      fullName: 'Tran Van Tai',
      role: 'DRIVER',
      licenseNo: 'GPLX-DEMO-001',
      phone: '0900000004',
    },
  });

  const limousine22 = await prisma.vehicleType.upsert({
    where: { id: 'vt-limousine-22' },
    update: {
      name: 'Limousine 22 phong',
      seatCount: 22,
      description: 'Xe limousine 22 phong don.',
    },
    create: {
      id: 'vt-limousine-22',
      name: 'Limousine 22 phong',
      seatCount: 22,
      description: 'Xe limousine 22 phong don.',
    },
  });

  const sleeper40 = await prisma.vehicleType.upsert({
    where: { id: 'vt-sleeper-40' },
    update: {
      name: 'Giuong nam 40 cho',
      seatCount: 40,
      description: 'Xe giuong nam 2 tang 40 cho.',
    },
    create: {
      id: 'vt-sleeper-40',
      name: 'Giuong nam 40 cho',
      seatCount: 40,
      description: 'Xe giuong nam 2 tang 40 cho.',
    },
  });

  await seedSeatLayouts(limousine22.id, limousine22Seats());
  await seedSeatLayouts(sleeper40.id, sleeper40Seats());

  const vehicles = {
    hcmDalat: await prisma.vehicle.upsert({
      where: { id: 'veh-demo-sleeper-dalat' },
      update: { operatorId: operator.id, vehicleTypeId: sleeper40.id, licensePlate: '51B-22345', manufactureYear: 2022, isActive: true },
      create: { id: 'veh-demo-sleeper-dalat', operatorId: operator.id, vehicleTypeId: sleeper40.id, licensePlate: '51B-22345', manufactureYear: 2022 },
    }),
    hcmNhaTrang: await prisma.vehicle.upsert({
      where: { id: 'veh-demo-sleeper-nhatrang' },
      update: { operatorId: operator.id, vehicleTypeId: sleeper40.id, licensePlate: '51B-77890', manufactureYear: 2021, isActive: true },
      create: { id: 'veh-demo-sleeper-nhatrang', operatorId: operator.id, vehicleTypeId: sleeper40.id, licensePlate: '51B-77890', manufactureYear: 2021 },
    }),
    hcmCanTho: await prisma.vehicle.upsert({
      where: { id: 'veh-demo-limo-cantho' },
      update: { operatorId: operator.id, vehicleTypeId: limousine22.id, licensePlate: '51F-24680', manufactureYear: 2023, isActive: true },
      create: { id: 'veh-demo-limo-cantho', operatorId: operator.id, vehicleTypeId: limousine22.id, licensePlate: '51F-24680', manufactureYear: 2023 },
    }),
    haNoiHaiPhong: await prisma.vehicle.upsert({
      where: { id: 'veh-demo-limo-haiphong' },
      update: { operatorId: operator.id, vehicleTypeId: limousine22.id, licensePlate: '29B-13579', manufactureYear: 2022, isActive: true },
      create: { id: 'veh-demo-limo-haiphong', operatorId: operator.id, vehicleTypeId: limousine22.id, licensePlate: '29B-13579', manufactureYear: 2022 },
    }),
    daNangHue: await prisma.vehicle.upsert({
      where: { id: 'veh-demo-limo-danang-hue' },
      update: { operatorId: operator.id, vehicleTypeId: limousine22.id, licensePlate: '43B-11223', manufactureYear: 2023, isActive: true },
      create: { id: 'veh-demo-limo-danang-hue', operatorId: operator.id, vehicleTypeId: limousine22.id, licensePlate: '43B-11223', manufactureYear: 2023 },
    }),
  };

  await Promise.all([
    prisma.vehicle.upsert({
      where: { id: 'veh-demo-limo-01' },
      update: { isActive: false },
      create: { id: 'veh-demo-limo-01', operatorId: operator.id, vehicleTypeId: limousine22.id, licensePlate: '51B-00001', manufactureYear: 2022, isActive: false },
    }),
    prisma.vehicle.upsert({
      where: { id: 'veh-demo-sleeper-01' },
      update: { isActive: false },
      create: { id: 'veh-demo-sleeper-01', operatorId: operator.id, vehicleTypeId: sleeper40.id, licensePlate: '51B-00002', manufactureYear: 2021, isActive: false },
    }),
  ]);

  const routeDefinitions = [
    {
      id: 'route-hcm-dalat',
      originCity: 'TP. Ho Chi Minh',
      destinationCity: 'Da Lat',
      originAddress: 'Ben xe Mien Dong Moi',
      destinationAddress: 'Ben xe Lien tinh Da Lat',
      distanceKm: 305,
      durationMinutes: 390,
      basePrice: 280000,
      times: ['06:00', '09:00', '13:00', '22:00'],
      vehicle: vehicles.hcmDalat,
      vehicleType: sleeper40,
    },
    {
      id: 'route-hcm-nhatrang',
      originCity: 'TP. Ho Chi Minh',
      destinationCity: 'Nha Trang',
      originAddress: 'Ben xe Mien Dong Moi',
      destinationAddress: 'Ben xe Phia Nam Nha Trang',
      distanceKm: 430,
      durationMinutes: 510,
      basePrice: 320000,
      times: ['07:00', '20:00', '22:30'],
      vehicle: vehicles.hcmNhaTrang,
      vehicleType: sleeper40,
    },
    {
      id: 'route-hcm-cantho',
      originCity: 'TP. Ho Chi Minh',
      destinationCity: 'Can Tho',
      originAddress: 'Ben xe Mien Tay',
      destinationAddress: 'Ben xe Trung tam Can Tho',
      distanceKm: 170,
      durationMinutes: 210,
      basePrice: 180000,
      times: ['05:30', '08:30', '14:00', '18:00'],
      vehicle: vehicles.hcmCanTho,
      vehicleType: limousine22,
    },
    {
      id: 'route-hanoi-haiphong',
      originCity: 'Ha Noi',
      destinationCity: 'Hai Phong',
      originAddress: 'Ben xe Gia Lam',
      destinationAddress: 'Ben xe Niem Nghia',
      distanceKm: 120,
      durationMinutes: 150,
      basePrice: 150000,
      times: ['06:30', '10:00', '15:00', '19:00'],
      vehicle: vehicles.haNoiHaiPhong,
      vehicleType: limousine22,
    },
    {
      id: 'route-danang-hue',
      originCity: 'Da Nang',
      destinationCity: 'Hue',
      originAddress: 'Ben xe Trung tam Da Nang',
      destinationAddress: 'Ben xe Phia Nam Hue',
      distanceKm: 100,
      durationMinutes: 150,
      basePrice: 140000,
      times: ['07:00', '11:00', '16:00'],
      vehicle: vehicles.daNangHue,
      vehicleType: limousine22,
    },
  ];

  const routes = [];
  for (const routeData of routeDefinitions) {
    const route = await prisma.route.upsert({
      where: { id: routeData.id },
      update: {
        operatorId: operator.id,
        originCity: routeData.originCity,
        destinationCity: routeData.destinationCity,
        originAddress: routeData.originAddress,
        destinationAddress: routeData.destinationAddress,
        distanceKm: routeData.distanceKm,
        durationMinutes: routeData.durationMinutes,
        isActive: true,
      },
      create: {
        id: routeData.id,
        operatorId: operator.id,
        originCity: routeData.originCity,
        destinationCity: routeData.destinationCity,
        originAddress: routeData.originAddress,
        destinationAddress: routeData.destinationAddress,
        distanceKm: routeData.distanceKm,
        durationMinutes: routeData.durationMinutes,
      },
    });
    routes.push({ ...routeData, route });
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  let tripCount = 0;
  for (let dayOffset = 0; dayOffset < 14; dayOffset += 1) {
    const serviceDate = new Date(tomorrow);
    serviceDate.setDate(tomorrow.getDate() + dayOffset);

    for (const item of routes) {
      for (const time of item.times) {
        const [hour, minute] = time.split(':').map(Number);
        const departureTime = new Date(serviceDate);
        departureTime.setHours(hour, minute, 0, 0);
        const estimatedArrival = addMinutes(departureTime, item.durationMinutes);
        const tripId = `trip-${item.route.id}-${formatDateId(serviceDate)}-${time.replace(':', '')}`;

        const trip = await prisma.trip.upsert({
          where: { id: tripId },
          update: {
            routeId: item.route.id,
            vehicleId: item.vehicle.id,
            departureTime,
            estimatedArrival,
            basePrice: item.basePrice,
            status: 'SCHEDULED',
            cancelReason: null,
          },
          create: {
            id: tripId,
            routeId: item.route.id,
            vehicleId: item.vehicle.id,
            departureTime,
            estimatedArrival,
            basePrice: item.basePrice,
            status: 'SCHEDULED',
          },
        });

        await ensureTripSeats(trip.id, item.vehicleType.id);
        await prisma.tripStaff.upsert({
          where: { tripId_staffId: { tripId: trip.id, staffId: driver.id } },
          update: { role: 'DRIVER' },
          create: { tripId: trip.id, staffId: driver.id, role: 'DRIVER' },
        });
        tripCount += 1;
      }
    }
  }

  const configs = [
    { key: 'BOOKING_LOCK_MINUTES', value: '15' },
    { key: 'MAX_SEATS_PER_BOOKING', value: '5' },
    { key: 'REFUND_POLICY_24H', value: '100' },
    { key: 'REFUND_POLICY_12H', value: '70' },
    { key: 'REFUND_POLICY_UNDER_12H', value: '0' },
    { key: 'LIST_LOCK_MINUTES_BEFORE_DEPARTURE', value: '15' },
  ];
  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config,
    });
  }

  console.log(`Seed completed. Generated ${routes.length} routes and ${tripCount} trips.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
