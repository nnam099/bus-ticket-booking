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

  async function ensureDriver({ email, phone, fullName, licenseNo }) {
    const staffUser = await prisma.user.upsert({
      where: { email },
      update: { isActive: true, isAnonymized: false, phone },
      create: { email, phone, passwordHash: demoPassword },
    });
    await attachRole(staffUser.id, staffRole.id);
    return prisma.staff.upsert({
      where: { userId: staffUser.id },
      update: { fullName, role: 'DRIVER', licenseNo, phone, operatorId: operator.id },
      create: { userId: staffUser.id, operatorId: operator.id, fullName, role: 'DRIVER', licenseNo, phone },
    });
  }

  const drivers = {
    hcmDalat: await ensureDriver({
      email: 'driver@demo.vn',
      phone: '0900000004',
      fullName: 'Tran Van Tai',
      licenseNo: 'GPLX-DEMO-001',
    }),
    hcmNhaTrang: await ensureDriver({
      email: 'driver.nhatrang@demo.vn',
      phone: '0900000005',
      fullName: 'Pham Van Bien',
      licenseNo: 'GPLX-DEMO-002',
    }),
    hcmCanTho: await ensureDriver({
      email: 'driver.cantho@demo.vn',
      phone: '0900000006',
      fullName: 'Le Van Song',
      licenseNo: 'GPLX-DEMO-003',
    }),
    haNoiHaiPhong: await ensureDriver({
      email: 'driver.haiphong@demo.vn',
      phone: '0900000007',
      fullName: 'Nguyen Van Bac',
      licenseNo: 'GPLX-DEMO-004',
    }),
    daNangHue: await ensureDriver({
      email: 'driver.hue@demo.vn',
      phone: '0900000008',
      fullName: 'Hoang Van Trung',
      licenseNo: 'GPLX-DEMO-005',
    }),
  };

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

  const corridorDefinitions = [
    {
      key: 'hcm-dalat',
      outwardId: 'route-hcm-dalat',
      returnId: 'route-dalat-hcm',
      outward: {
        originCity: 'Hồ Chí Minh',
        destinationCity: 'Đà Lạt',
        originAddress: 'Bến xe Miền Đông Mới',
        destinationAddress: 'Bến xe liên tỉnh Đà Lạt',
      },
      distanceKm: 305,
      durationMinutes: 390,
      basePrice: 280000,
      vehicle: vehicles.hcmDalat,
      vehicleType: sleeper40,
      driver: drivers.hcmDalat,
      cycleTimes: ['06:00', '14:00', '22:00'],
    },
    {
      key: 'hcm-nhatrang',
      outwardId: 'route-hcm-nhatrang',
      returnId: 'route-nhatrang-hcm',
      outward: {
        originCity: 'Hồ Chí Minh',
        destinationCity: 'Nha Trang',
        originAddress: 'Bến xe Miền Đông Mới',
        destinationAddress: 'Bến xe phía Nam Nha Trang',
      },
      distanceKm: 430,
      durationMinutes: 510,
      basePrice: 320000,
      vehicle: vehicles.hcmNhaTrang,
      vehicleType: sleeper40,
      driver: drivers.hcmNhaTrang,
      cycleTimes: ['07:00', '17:00'],
    },
    {
      key: 'hcm-cantho',
      outwardId: 'route-hcm-cantho',
      returnId: 'route-cantho-hcm',
      outward: {
        originCity: 'Hồ Chí Minh',
        destinationCity: 'Cần Thơ',
        originAddress: 'Bến xe Miền Tây',
        destinationAddress: 'Bến xe trung tâm Cần Thơ',
      },
      distanceKm: 170,
      durationMinutes: 210,
      basePrice: 180000,
      vehicle: vehicles.hcmCanTho,
      vehicleType: limousine22,
      driver: drivers.hcmCanTho,
      cycleTimes: ['05:30', '10:30', '15:30', '20:30'],
    },
    {
      key: 'hanoi-haiphong',
      outwardId: 'route-hanoi-haiphong',
      returnId: 'route-haiphong-hanoi',
      outward: {
        originCity: 'Hà Nội',
        destinationCity: 'Hải Phòng',
        originAddress: 'Bến xe Gia Lâm',
        destinationAddress: 'Bến xe Niệm Nghĩa',
      },
      distanceKm: 120,
      durationMinutes: 150,
      basePrice: 150000,
      vehicle: vehicles.haNoiHaiPhong,
      vehicleType: limousine22,
      driver: drivers.haNoiHaiPhong,
      cycleTimes: ['06:30', '10:30', '14:30', '18:30'],
    },
    {
      key: 'danang-hue',
      outwardId: 'route-danang-hue',
      returnId: 'route-hue-danang',
      outward: {
        originCity: 'Đà Nẵng',
        destinationCity: 'Huế',
        originAddress: 'Bến xe trung tâm Đà Nẵng',
        destinationAddress: 'Bến xe phía Nam Huế',
      },
      distanceKm: 100,
      durationMinutes: 150,
      basePrice: 140000,
      vehicle: vehicles.daNangHue,
      vehicleType: limousine22,
      driver: drivers.daNangHue,
      cycleTimes: ['07:00', '11:00', '15:00', '19:00'],
    },
  ];

  const routeDefinitions = corridorDefinitions.flatMap((corridor) => [
    {
      id: corridor.outwardId,
      originCity: corridor.outward.originCity,
      destinationCity: corridor.outward.destinationCity,
      originAddress: corridor.outward.originAddress,
      destinationAddress: corridor.outward.destinationAddress,
      distanceKm: corridor.distanceKm,
      durationMinutes: corridor.durationMinutes,
    },
    {
      id: corridor.returnId,
      originCity: corridor.outward.destinationCity,
      destinationCity: corridor.outward.originCity,
      originAddress: corridor.outward.destinationAddress,
      destinationAddress: corridor.outward.originAddress,
      distanceKm: corridor.distanceKm,
      durationMinutes: corridor.durationMinutes,
    },
  ]);
  const routeIds = routeDefinitions.map((route) => route.id);

  await prisma.review.deleteMany({
    where: { ticketDetail: { tripSeat: { trip: { routeId: { in: routeIds } } } } },
  });
  await prisma.payment.deleteMany({
    where: { order: { ticketDetails: { some: { tripSeat: { trip: { routeId: { in: routeIds } } } } } } },
  });
  await prisma.ticketDetail.deleteMany({
    where: { tripSeat: { trip: { routeId: { in: routeIds } } } },
  });
  await prisma.order.deleteMany({ where: { ticketDetails: { none: {} } } });
  await prisma.tripStaff.deleteMany({ where: { trip: { routeId: { in: routeIds } } } });
  await prisma.tripSeat.deleteMany({ where: { trip: { routeId: { in: routeIds } } } });
  await prisma.trip.deleteMany({ where: { routeId: { in: routeIds } } });

  const routeById = {};
  for (const routeData of routeDefinitions) {
    routeById[routeData.id] = await prisma.route.upsert({
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
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let tripCount = 0;
  for (let dayOffset = 0; dayOffset < 60; dayOffset += 1) {
    const serviceDate = new Date(today);
    serviceDate.setDate(today.getDate() + dayOffset);

    for (const corridor of corridorDefinitions) {
      const returnsToOriginDaily = corridor.cycleTimes.length % 2 === 0;
      const startsOutward = returnsToOriginDaily || dayOffset % 2 === 0;

      for (const [index, time] of corridor.cycleTimes.entries()) {
        const isOutward = index % 2 === 0 ? startsOutward : !startsOutward;
        const routeId = isOutward ? corridor.outwardId : corridor.returnId;
        const route = routeById[routeId];
        const [hour, minute] = time.split(':').map(Number);
        const departureTime = new Date(serviceDate);
        departureTime.setHours(hour, minute, 0, 0);
        const estimatedArrival = addMinutes(departureTime, corridor.durationMinutes);
        const tripId = `trip-${route.id}-${formatDateId(serviceDate)}-${time.replace(':', '')}`;

        const trip = await prisma.trip.create({
          data: {
            id: tripId,
            routeId: route.id,
            vehicleId: corridor.vehicle.id,
            departureTime,
            estimatedArrival,
            basePrice: corridor.basePrice,
            status: 'SCHEDULED',
          },
        });

        await ensureTripSeats(trip.id, corridor.vehicleType.id);
        await prisma.tripStaff.create({
          data: { tripId: trip.id, staffId: corridor.driver.id, role: 'DRIVER' },
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

  console.log(`Seed completed. Generated ${routeDefinitions.length} routes and ${tripCount} trips.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
