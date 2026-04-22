const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Seed Roles
  const roles = await Promise.all([
    prisma.role.upsert({ where: { name: 'ADMIN' }, update: {}, create: { name: 'ADMIN', description: 'Quản trị hệ thống' } }),
    prisma.role.upsert({ where: { name: 'CUSTOMER' }, update: {}, create: { name: 'CUSTOMER', description: 'Khách hàng' } }),
    prisma.role.upsert({ where: { name: 'BUS_OPERATOR' }, update: {}, create: { name: 'BUS_OPERATOR', description: 'Nhà xe' } }),
    prisma.role.upsert({ where: { name: 'STAFF' }, update: {}, create: { name: 'STAFF', description: 'Nhân viên / Tài xế' } }),
  ]);
  console.log('✅ Roles seeded');

  const passwordHash = await bcrypt.hash('Admin@123', 10);

  // Seed Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@busticket.vn' },
    update: {},
    create: {
      email: 'admin@busticket.vn',
      phone: '0900000001',
      passwordHash,
      userRoles: { create: { roleId: roles[0].id } },
    },
  });
  console.log('✅ Admin user seeded');

  // Seed Bus Operator User
  const operatorPwd = await bcrypt.hash('Demo@123', 10);
  const operatorUser = await prisma.user.upsert({
    where: { email: 'operator@demo.vn' },
    update: {},
    create: {
      email: 'operator@demo.vn',
      phone: '0900000002',
      passwordHash: operatorPwd,
      userRoles: { create: { roleId: roles[2].id } },
      busOperator: {
        create: {
          companyName: 'Nhà Xe Demo Express',
          licenseNumber: 'NX-DEMO-001',
          hotline: '1900 1234',
          address: '123 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh',
          description: 'Nhà xe demo cho môi trường development',
          isApproved: true,
          approvedAt: new Date(),
        },
      },
    },
  });
  console.log('✅ Bus operator seeded');

  // Seed Customer
  const customerPwd = await bcrypt.hash('Demo@123', 10);
  await prisma.user.upsert({
    where: { email: 'customer@demo.vn' },
    update: {},
    create: {
      email: 'customer@demo.vn',
      phone: '0900000003',
      passwordHash: customerPwd,
      userRoles: { create: { roleId: roles[1].id } },
      customer: {
        create: {
          fullName: 'Nguyễn Văn Demo',
        },
      },
    },
  });
  console.log('✅ Customer seeded');

  // Seed Vehicle Types
  const vt1 = await prisma.vehicleType.upsert({
    where: { id: 'vt-limousine-22' },
    update: {},
    create: {
      id: 'vt-limousine-22',
      name: 'Limousine 22 phòng',
      seatCount: 22,
      description: 'Xe Limousine cao cấp 22 phòng đơn',
    },
  });

  const vt2 = await prisma.vehicleType.upsert({
    where: { id: 'vt-sleeper-40' },
    update: {},
    create: {
      id: 'vt-sleeper-40',
      name: 'Giường nằm 40 chỗ',
      seatCount: 40,
      description: 'Xe giường nằm 2 tầng 40 chỗ',
    },
  });

  // Seed Seat Layouts for Limousine 22
  const seatCodes = [];
  for (let r = 1; r <= 11; r++) {
    seatCodes.push({ seatCode: `A${r}`, row: r, col: 1, floor: 1, seatType: 'SINGLE' });
    seatCodes.push({ seatCode: `B${r}`, row: r, col: 2, floor: 1, seatType: 'SINGLE' });
  }
  for (const s of seatCodes) {
    await prisma.seatLayout.upsert({
      where: { vehicleTypeId_seatCode: { vehicleTypeId: vt1.id, seatCode: s.seatCode } },
      update: {},
      create: { vehicleTypeId: vt1.id, ...s },
    });
  }
  console.log('✅ Vehicle types and seat layouts seeded');

  // Seed System Config
  const configs = [
    { key: 'BOOKING_LOCK_MINUTES', value: '15' },
    { key: 'MAX_SEATS_PER_BOOKING', value: '5' },
    { key: 'REFUND_POLICY_24H', value: '100' },
    { key: 'REFUND_POLICY_12H', value: '70' },
    { key: 'REFUND_POLICY_UNDER_12H', value: '0' },
    { key: 'LIST_LOCK_MINUTES_BEFORE_DEPARTURE', value: '15' },
  ];
  for (const c of configs) {
    await prisma.systemConfig.upsert({ where: { key: c.key }, update: { value: c.value }, create: c });
  }
  console.log('✅ System configs seeded');

  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
