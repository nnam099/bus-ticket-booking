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

const operatorNames = [
  "Thành Công", "Hòa Bình", "Tuấn Đạt", "Minh Thắng", "Đại Nam", 
  "Bảo Yến", "Ngọc Ánh", "Quốc Đạt", "Tiến Phước", "Kim Liên",
  "Hải Đăng", "Hồng Nga", "Hoàng Gia", "Thiên Tứ", "Đức Huy",
  "Cường Phát", "Bình Minh", "Tân Đạt", "Nhật Anh", "Việt Thắng"
];

const cities = ["Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Nha Trang", "Đà Lạt", "Cần Thơ", "Hải Phòng", "Vũng Tàu"];

async function main() {
  const staffRole = await prisma.role.findUnique({ where: { name: 'STAFF' } });
  const operatorRole = await prisma.role.findUnique({ where: { name: 'BUS_OPERATOR' } });
  const demoPassword = await bcrypt.hash('Demo@123', 10);
  
  const vehicleType = await prisma.vehicleType.findFirst({ where: { seatCount: 40 } });

  console.log(`Bắt đầu tạo thêm ${operatorNames.length} nhà xe và nhân viên...`);

  for (let i = 0; i < operatorNames.length; i++) {
    const opName = operatorNames[i];
    const emailSuffix = `op${Math.floor(Math.random() * 100000)}`;
    const email = `contact@${emailSuffix}.vn`;
    const phone = `077${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`;

    // Tạo User cho Operator
    const user = await prisma.user.upsert({
      where: { email },
      update: { isActive: true, isAnonymized: false, phone },
      create: { email, phone, passwordHash: demoPassword },
    });
    await attachRole(user.id, operatorRole.id);

    // Tạo BusOperator
    const operator = await prisma.busOperator.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        companyName: `Nhà xe ${opName}`,
        licenseNumber: `NX-${emailSuffix}`,
        hotline: phone,
        address: `123 Đường ${opName}, Việt Nam`,
        description: `Hãng xe uy tín ${opName} chuyên phục vụ hành khách với chất lượng cao nhất.`,
        isApproved: true,
        approvedAt: new Date(),
      },
    });

    // Tạo 15 nhân viên / tài xế cho nhà xe này
    const drivers = [];
    for (let j = 1; j <= 15; j++) {
      const dEmail = `driver.${emailSuffix}.${j}@demo.vn`;
      const dPhone = `088${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`;
      
      const staffUser = await prisma.user.upsert({
        where: { email: dEmail },
        update: { isActive: true, phone: dPhone },
        create: { email: dEmail, phone: dPhone, passwordHash: demoPassword },
      });
      await attachRole(staffUser.id, staffRole.id);
      
      const driver = await prisma.staff.upsert({
        where: { userId: staffUser.id },
        update: {},
        create: { 
          userId: staffUser.id, 
          operatorId: operator.id, 
          fullName: `Tài xế ${opName} ${j}`, 
          role: 'DRIVER', 
          licenseNo: `GPLX-${emailSuffix}-${j}`, 
          phone: dPhone 
        },
      });
      drivers.push(driver);
    }

    // Tạo 5 xe cho nhà xe này
    const vehicles = [];
    for (let j = 1; j <= 5; j++) {
      const v = await prisma.vehicle.create({
        data: {
          id: `veh-${emailSuffix}-${j}`,
          operatorId: operator.id,
          vehicleTypeId: vehicleType.id,
          licensePlate: `${Math.floor(Math.random() * 90 + 10)}B-${Math.floor(Math.random() * 90000 + 10000)}`,
          manufactureYear: 2023,
          isActive: true
        }
      });
      vehicles.push(v);
    }
    
    // Tạo 1 Tuyến đường ngẫu nhiên cho nhà xe này
    const origin = cities[Math.floor(Math.random() * cities.length)];
    let destination = cities[Math.floor(Math.random() * cities.length)];
    while (destination === origin) {
      destination = cities[Math.floor(Math.random() * cities.length)];
    }
    
    const route = await prisma.route.create({
      data: {
        id: `route-${emailSuffix}`,
        operatorId: operator.id,
        originCity: origin,
        destinationCity: destination,
        originAddress: `Bến xe trung tâm ${origin}`,
        destinationAddress: `Bến xe trung tâm ${destination}`,
        distanceKm: 300,
        durationMinutes: 400,
        isActive: true
      }
    });

    console.log(`Đã tạo nhà xe ${opName} với 15 tài xế, 5 xe và tuyến ${origin} -> ${destination}`);
  }

  console.log('Thêm thành công dữ liệu khổng lồ!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
