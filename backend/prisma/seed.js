const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const path = require('path');
const QRCode = require('qrcode');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { createPublicCode, createQrPayload } = require('../src/utils/security');

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

  async function ensureOperator({ email, phone, companyName, licenseNumber, hotline, address, description }) {
    const user = await prisma.user.upsert({
      where: { email },
      update: { isActive: true, isAnonymized: false, phone },
      create: { email, phone, passwordHash: demoPassword },
    });
    await attachRole(user.id, operatorRole.id);
    return prisma.busOperator.upsert({
      where: { userId: user.id },
      update: {
        companyName,
        licenseNumber,
        hotline,
        address,
        description,
        isApproved: true,
        approvedAt: new Date(),
        approvedBy: adminUser.id,
      },
      create: {
        userId: user.id,
        companyName,
        licenseNumber,
        hotline,
        address,
        description,
        isApproved: true,
        approvedAt: new Date(),
        approvedBy: adminUser.id,
      },
    });
  }

  const operators = {
    demo: operator,
    coastal: await ensureOperator({
      email: 'operator.coastal@demo.vn',
      phone: '0900000021',
      companyName: 'Sai Gon Coastal Bus',
      licenseNumber: 'NX-COAST-002',
      hotline: '1900 2202',
      address: '45 Dien Bien Phu, Binh Thanh, TP. Ho Chi Minh',
      description: 'Nha xe chuyen cac tuyen bien mien Nam va Nam Trung Bo.',
    }),
    mekong: await ensureOperator({
      email: 'operator.mekong@demo.vn',
      phone: '0900000022',
      companyName: 'Mekong Connect',
      licenseNumber: 'NX-MEKONG-003',
      hotline: '1900 3303',
      address: '12 Nguyen Van Linh, Ninh Kieu, Can Tho',
      description: 'Nha xe phuc vu cac tuyen mien Tay va dong bang song Cuu Long.',
    }),
    north: await ensureOperator({
      email: 'operator.north@demo.vn',
      phone: '0900000023',
      companyName: 'North Star Limousine',
      licenseNumber: 'NX-NORTH-004',
      hotline: '1900 4404',
      address: '88 Pham Hung, Nam Tu Liem, Ha Noi',
      description: 'Nha xe khai thac cac tuyen phia Bac, tap trung Ha Noi va vung lan can.',
    }),
    central: await ensureOperator({
      email: 'operator.central@demo.vn',
      phone: '0900000024',
      companyName: 'Central Heritage Bus',
      licenseNumber: 'NX-CENTRAL-005',
      hotline: '1900 5505',
      address: '09 Dien Bien Phu, Thanh Khe, Da Nang',
      description: 'Nha xe khu vuc mien Trung voi cac tuyen ngan va trung chuyen.',
    }),
    highland: await ensureOperator({
      email: 'operator.highland@demo.vn',
      phone: '0900000025',
      companyName: 'Highland Night Express',
      licenseNumber: 'NX-HIGHLAND-006',
      hotline: '1900 6606',
      address: '27 Nguyen Tat Thanh, Buon Ma Thuot',
      description: 'Nha xe chuyen cac tuyen Tay Nguyen va xe giuong nam dem.',
    }),
    eastern: await ensureOperator({
      email: 'operator.eastern@demo.vn',
      phone: '0900000026',
      companyName: 'Eastern Express',
      licenseNumber: 'NX-EAST-007',
      hotline: '1900 7707',
      address: '101 Nguyen Thai Hoc, Dong Nai',
      description: 'Nha xe phuc vu mien Dong Nam Bo va Nam Trung Bo.',
    }),
    western: await ensureOperator({
      email: 'operator.western@demo.vn',
      phone: '0900000027',
      companyName: 'Western Trans',
      licenseNumber: 'NX-WEST-008',
      hotline: '1900 8808',
      address: '22 Le Duan, Kien Giang',
      description: 'Nha xe phuc vu cac tinh mien Tay nam bo va bien.',
    }),
  };

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
  const customer = await prisma.customer.upsert({
    where: { userId: customerUser.id },
    update: { fullName: 'Nguyen Minh An' },
    create: { userId: customerUser.id, fullName: 'Nguyen Minh An' },
  });

  async function ensureDriver({ email, phone, fullName, licenseNo, operator: driverOperator = operator }) {
    const staffUser = await prisma.user.upsert({
      where: { email },
      update: { isActive: true, isAnonymized: false, phone },
      create: { email, phone, passwordHash: demoPassword },
    });
    await attachRole(staffUser.id, staffRole.id);
    return prisma.staff.upsert({
      where: { userId: staffUser.id },
      update: { fullName, role: 'DRIVER', licenseNo, phone, operatorId: driverOperator.id },
      create: { userId: staffUser.id, operatorId: driverOperator.id, fullName, role: 'DRIVER', licenseNo, phone },
    });
  }

  const drivers = {
    hcmDalat: await ensureDriver({
      email: 'driver@demo.vn',
      phone: '0900000004',
      fullName: 'Tran Van Tai',
      licenseNo: 'GPLX-DEMO-001',
      operator: operators.demo,
    }),
    hcmNhaTrang: await ensureDriver({
      email: 'driver.nhatrang@demo.vn',
      phone: '0900000005',
      fullName: 'Pham Van Bien',
      licenseNo: 'GPLX-DEMO-002',
      operator: operators.demo,
    }),
    hcmCanTho: await ensureDriver({
      email: 'driver.cantho@demo.vn',
      phone: '0900000006',
      fullName: 'Le Van Song',
      licenseNo: 'GPLX-DEMO-003',
      operator: operators.mekong,
    }),
    haNoiHaiPhong: await ensureDriver({
      email: 'driver.haiphong@demo.vn',
      phone: '0900000007',
      fullName: 'Nguyen Van Bac',
      licenseNo: 'GPLX-DEMO-004',
      operator: operators.north,
    }),
    daNangHue: await ensureDriver({
      email: 'driver.hue@demo.vn',
      phone: '0900000008',
      fullName: 'Hoang Van Trung',
      licenseNo: 'GPLX-DEMO-005',
      operator: operators.central,
    }),
    hcmVungTau: await ensureDriver({
      email: 'driver.vungtau@demo.vn',
      phone: '0900000009',
      fullName: 'Do Van Bien',
      licenseNo: 'GPLX-DEMO-006',
      operator: operators.coastal,
    }),
    hcmPhanThiet: await ensureDriver({
      email: 'driver.phanthiet@demo.vn',
      phone: '0900000010',
      fullName: 'Bui Van Cat',
      licenseNo: 'GPLX-DEMO-007',
      operator: operators.coastal,
    }),
    hcmBuonMaThuot: await ensureDriver({
      email: 'driver.buonmathuot@demo.vn',
      phone: '0900000011',
      fullName: 'Y Nguyen Nie',
      licenseNo: 'GPLX-DEMO-008',
      operator: operators.highland,
    }),
    hcmQuyNhon: await ensureDriver({
      email: 'driver.quynhon@demo.vn',
      phone: '0900000012',
      fullName: 'Vo Van Ghenh',
      licenseNo: 'GPLX-DEMO-009',
      operator: operators.coastal,
    }),
    daNangQuangNgai: await ensureDriver({
      email: 'driver.quangngai@demo.vn',
      phone: '0900000013',
      fullName: 'Tran Van An',
      licenseNo: 'GPLX-DEMO-010',
      operator: operators.central,
    }),
    haNoiLaoCai: await ensureDriver({
      email: 'driver.laocai@demo.vn',
      phone: '0900000014',
      fullName: 'Pham Van Nui',
      licenseNo: 'GPLX-DEMO-011',
      operator: operators.north,
    }),
    haNoiNinhBinh: await ensureDriver({
      email: 'driver.ninhbinh@demo.vn',
      phone: '0900000015',
      fullName: 'Le Van Tam',
      licenseNo: 'GPLX-DEMO-012',
      operator: operators.north,
    }),
    haNoiThanhHoa: await ensureDriver({
      email: 'driver.thanhhoa@demo.vn',
      phone: '0900000016',
      fullName: 'Nguyen Van Son',
      licenseNo: 'GPLX-DEMO-013',
      operator: operators.north,
    }),
    haNoiVinh: await ensureDriver({
      email: 'driver.vinh@demo.vn',
      phone: '0900000017',
      fullName: 'Ho Van Lam',
      licenseNo: 'GPLX-DEMO-014',
      operator: operators.north,
    }),
    canThoCaMau: await ensureDriver({
      email: 'driver.camau@demo.vn',
      phone: '0900000018',
      fullName: 'Huynh Van Dat',
      licenseNo: 'GPLX-DEMO-015',
      operator: operators.mekong,
    }),
    hcmDaNang: await ensureDriver({ email: 'driver.hcm_danang@demo.vn', phone: '0900000028', fullName: 'Phan Van Tuan', licenseNo: 'GPLX-DEMO-016', operator: operators.demo }),
    hanoiDaNang: await ensureDriver({ email: 'driver.hanoi_danang@demo.vn', phone: '0900000029', fullName: 'Bui Van Quang', licenseNo: 'GPLX-DEMO-017', operator: operators.north }),
    daNangNhaTrang: await ensureDriver({ email: 'driver.danang_nhatrang@demo.vn', phone: '0900000030', fullName: 'Dinh Van Hai', licenseNo: 'GPLX-DEMO-018', operator: operators.central }),
    canThoRachGia: await ensureDriver({ email: 'driver.cantho_rachgia@demo.vn', phone: '0900000031', fullName: 'Mai Van Kien', licenseNo: 'GPLX-DEMO-019', operator: operators.western }),
    daLatNhaTrang: await ensureDriver({ email: 'driver.dalat_nhatrang@demo.vn', phone: '0900000032', fullName: 'Trinh Van Phuc', licenseNo: 'GPLX-DEMO-020', operator: operators.highland }),
    haiPhongQuangNinh: await ensureDriver({ email: 'driver.haiphong_quangninh@demo.vn', phone: '0900000033', fullName: 'Dao Van Thanh', licenseNo: 'GPLX-DEMO-021', operator: operators.eastern }),
    hcmHanoiA: await ensureDriver({ email: 'driver.hcm_hanoi_a@demo.vn', phone: '0900000034', fullName: 'Nguyen Van Long', licenseNo: 'GPLX-DEMO-022', operator: operators.demo }),
    hcmHanoiB: await ensureDriver({ email: 'driver.hcm_hanoi_b@demo.vn', phone: '0900000035', fullName: 'Tran Van Nam', licenseNo: 'GPLX-DEMO-023', operator: operators.demo }),
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

  const ensureVehicle = ({ id, vehicleType, licensePlate, manufactureYear, operator: vehicleOperator = operator }) =>
    prisma.vehicle.upsert({
      where: { id },
      update: { operatorId: vehicleOperator.id, vehicleTypeId: vehicleType.id, licensePlate, manufactureYear, isActive: true },
      create: { id, operatorId: vehicleOperator.id, vehicleTypeId: vehicleType.id, licensePlate, manufactureYear },
    });

  const vehicles = {
    hcmDalat: await ensureVehicle({ id: 'veh-demo-sleeper-dalat', vehicleType: sleeper40, licensePlate: '51B-22345', manufactureYear: 2022, operator: operators.demo }),
    hcmNhaTrang: await ensureVehicle({ id: 'veh-demo-sleeper-nhatrang', vehicleType: sleeper40, licensePlate: '51B-77890', manufactureYear: 2021, operator: operators.demo }),
    hcmCanTho: await ensureVehicle({ id: 'veh-demo-limo-cantho', vehicleType: limousine22, licensePlate: '51F-24680', manufactureYear: 2023, operator: operators.mekong }),
    haNoiHaiPhong: await ensureVehicle({ id: 'veh-demo-limo-haiphong', vehicleType: limousine22, licensePlate: '29B-13579', manufactureYear: 2022, operator: operators.north }),
    daNangHue: await ensureVehicle({ id: 'veh-demo-limo-danang-hue', vehicleType: limousine22, licensePlate: '43B-11223', manufactureYear: 2023, operator: operators.central }),
    hcmVungTau: await ensureVehicle({ id: 'veh-demo-limo-vungtau', vehicleType: limousine22, licensePlate: '51G-86420', manufactureYear: 2024, operator: operators.coastal }),
    hcmPhanThiet: await ensureVehicle({ id: 'veh-demo-sleeper-phanthiet', vehicleType: sleeper40, licensePlate: '51H-97531', manufactureYear: 2022, operator: operators.coastal }),
    hcmBuonMaThuot: await ensureVehicle({ id: 'veh-demo-sleeper-buonmathuot', vehicleType: sleeper40, licensePlate: '51K-46802', manufactureYear: 2021, operator: operators.highland }),
    hcmQuyNhon: await ensureVehicle({ id: 'veh-demo-sleeper-quynhon', vehicleType: sleeper40, licensePlate: '51L-75319', manufactureYear: 2022, operator: operators.coastal }),
    daNangQuangNgai: await ensureVehicle({ id: 'veh-demo-limo-quangngai', vehicleType: limousine22, licensePlate: '43C-33445', manufactureYear: 2023, operator: operators.central }),
    haNoiLaoCai: await ensureVehicle({ id: 'veh-demo-sleeper-laocai', vehicleType: sleeper40, licensePlate: '29C-24681', manufactureYear: 2022, operator: operators.north }),
    haNoiNinhBinh: await ensureVehicle({ id: 'veh-demo-limo-ninhbinh', vehicleType: limousine22, licensePlate: '29D-11224', manufactureYear: 2023, operator: operators.north }),
    haNoiThanhHoa: await ensureVehicle({ id: 'veh-demo-limo-thanhhoa', vehicleType: limousine22, licensePlate: '29E-55667', manufactureYear: 2021, operator: operators.north }),
    haNoiVinh: await ensureVehicle({ id: 'veh-demo-sleeper-vinh', vehicleType: sleeper40, licensePlate: '29F-77889', manufactureYear: 2022, operator: operators.north }),
    canThoCaMau: await ensureVehicle({ id: 'veh-demo-limo-camau', vehicleType: limousine22, licensePlate: '65A-13580', manufactureYear: 2023, operator: operators.mekong }),
    hcmDaNang: await ensureVehicle({ id: 'veh-demo-sleeper-hcm-danang', vehicleType: sleeper40, licensePlate: '51M-11223', manufactureYear: 2024, operator: operators.demo }),
    hanoiDaNang: await ensureVehicle({ id: 'veh-demo-sleeper-hanoi-danang', vehicleType: sleeper40, licensePlate: '29G-33445', manufactureYear: 2023, operator: operators.north }),
    daNangNhaTrang: await ensureVehicle({ id: 'veh-demo-limo-danang-nhatrang', vehicleType: limousine22, licensePlate: '43D-55667', manufactureYear: 2022, operator: operators.central }),
    canThoRachGia: await ensureVehicle({ id: 'veh-demo-limo-cantho-rachgia', vehicleType: limousine22, licensePlate: '68A-77889', manufactureYear: 2023, operator: operators.western }),
    daLatNhaTrang: await ensureVehicle({ id: 'veh-demo-limo-dalat-nhatrang', vehicleType: limousine22, licensePlate: '49B-99001', manufactureYear: 2021, operator: operators.highland }),
    haiPhongQuangNinh: await ensureVehicle({ id: 'veh-demo-limo-haiphong-quangninh', vehicleType: limousine22, licensePlate: '15A-22334', manufactureYear: 2024, operator: operators.eastern }),
    hcmHanoiA: await ensureVehicle({ id: 'veh-demo-sleeper-hcm-hanoi-a', vehicleType: sleeper40, licensePlate: '51N-33445', manufactureYear: 2024, operator: operators.demo }),
    hcmHanoiB: await ensureVehicle({ id: 'veh-demo-sleeper-hcm-hanoi-b', vehicleType: sleeper40, licensePlate: '51N-55667', manufactureYear: 2023, operator: operators.demo }),
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
      operator: operators.demo,
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
      operator: operators.demo,
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
      operator: operators.mekong,
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
      operator: operators.north,
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
      operator: operators.central,
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
    {
      key: 'hcm-vungtau',
      operator: operators.coastal,
      outwardId: 'route-hcm-vungtau',
      returnId: 'route-vungtau-hcm',
      outward: {
        originCity: 'Hồ Chí Minh',
        destinationCity: 'Vũng Tàu',
        originAddress: 'Bến xe Miền Đông Mới',
        destinationAddress: 'Bến xe Vũng Tàu',
      },
      distanceKm: 100,
      durationMinutes: 150,
      basePrice: 120000,
      vehicle: vehicles.hcmVungTau,
      vehicleType: limousine22,
      driver: drivers.hcmVungTau,
      cycleTimes: ['06:00', '09:30', '13:00', '16:30', '20:00'],
    },
    {
      key: 'hcm-phanthiet',
      operator: operators.coastal,
      outwardId: 'route-hcm-phanthiet',
      returnId: 'route-phanthiet-hcm',
      outward: {
        originCity: 'Hồ Chí Minh',
        destinationCity: 'Phan Thiết',
        originAddress: 'Bến xe Miền Đông Mới',
        destinationAddress: 'Bến xe Phan Thiết',
      },
      distanceKm: 200,
      durationMinutes: 270,
      basePrice: 220000,
      vehicle: vehicles.hcmPhanThiet,
      vehicleType: sleeper40,
      driver: drivers.hcmPhanThiet,
      cycleTimes: ['07:00', '13:00', '19:00'],
    },
    {
      key: 'hcm-buonmathuot',
      operator: operators.highland,
      outwardId: 'route-hcm-buonmathuot',
      returnId: 'route-buonmathuot-hcm',
      outward: {
        originCity: 'Hồ Chí Minh',
        destinationCity: 'Buôn Ma Thuột',
        originAddress: 'Bến xe Miền Đông Mới',
        destinationAddress: 'Bến xe phía Bắc Buôn Ma Thuột',
      },
      distanceKm: 350,
      durationMinutes: 480,
      basePrice: 300000,
      vehicle: vehicles.hcmBuonMaThuot,
      vehicleType: sleeper40,
      driver: drivers.hcmBuonMaThuot,
      cycleTimes: ['06:30', '16:00'],
    },
    {
      key: 'hcm-quynhon',
      operator: operators.coastal,
      outwardId: 'route-hcm-quynhon',
      returnId: 'route-quynhon-hcm',
      outward: {
        originCity: 'Hồ Chí Minh',
        destinationCity: 'Quy Nhơn',
        originAddress: 'Bến xe Miền Đông Mới',
        destinationAddress: 'Bến xe Quy Nhơn',
      },
      distanceKm: 650,
      durationMinutes: 720,
      basePrice: 420000,
      vehicle: vehicles.hcmQuyNhon,
      vehicleType: sleeper40,
      driver: drivers.hcmQuyNhon,
      cycleTimes: ['07:00', '20:00'],
    },
    {
      key: 'danang-quangngai',
      operator: operators.central,
      outwardId: 'route-danang-quangngai',
      returnId: 'route-quangngai-danang',
      outward: {
        originCity: 'Đà Nẵng',
        destinationCity: 'Quảng Ngãi',
        originAddress: 'Bến xe trung tâm Đà Nẵng',
        destinationAddress: 'Bến xe Quảng Ngãi',
      },
      distanceKm: 145,
      durationMinutes: 210,
      basePrice: 160000,
      vehicle: vehicles.daNangQuangNgai,
      vehicleType: limousine22,
      driver: drivers.daNangQuangNgai,
      cycleTimes: ['06:30', '10:30', '14:30', '18:30'],
    },
    {
      key: 'hanoi-laocai',
      operator: operators.north,
      outwardId: 'route-hanoi-laocai',
      returnId: 'route-laocai-hanoi',
      outward: {
        originCity: 'Hà Nội',
        destinationCity: 'Lào Cai',
        originAddress: 'Bến xe Mỹ Đình',
        destinationAddress: 'Bến xe trung tâm Lào Cai',
      },
      distanceKm: 320,
      durationMinutes: 360,
      basePrice: 260000,
      vehicle: vehicles.haNoiLaoCai,
      vehicleType: sleeper40,
      driver: drivers.haNoiLaoCai,
      cycleTimes: ['06:00', '14:00', '22:00'],
    },
    {
      key: 'hanoi-ninhbinh',
      operator: operators.north,
      outwardId: 'route-hanoi-ninhbinh',
      returnId: 'route-ninhbinh-hanoi',
      outward: {
        originCity: 'Hà Nội',
        destinationCity: 'Ninh Bình',
        originAddress: 'Bến xe Giáp Bát',
        destinationAddress: 'Bến xe Ninh Bình',
      },
      distanceKm: 95,
      durationMinutes: 120,
      basePrice: 120000,
      vehicle: vehicles.haNoiNinhBinh,
      vehicleType: limousine22,
      driver: drivers.haNoiNinhBinh,
      cycleTimes: ['06:00', '09:00', '12:00', '15:00', '18:00'],
    },
    {
      key: 'hanoi-thanhhoa',
      operator: operators.north,
      outwardId: 'route-hanoi-thanhhoa',
      returnId: 'route-thanhhoa-hanoi',
      outward: {
        originCity: 'Hà Nội',
        destinationCity: 'Thanh Hóa',
        originAddress: 'Bến xe Nước Ngầm',
        destinationAddress: 'Bến xe phía Bắc Thanh Hóa',
      },
      distanceKm: 160,
      durationMinutes: 210,
      basePrice: 170000,
      vehicle: vehicles.haNoiThanhHoa,
      vehicleType: limousine22,
      driver: drivers.haNoiThanhHoa,
      cycleTimes: ['06:30', '10:30', '14:30', '18:30'],
    },
    {
      key: 'hanoi-vinh',
      operator: operators.north,
      outwardId: 'route-hanoi-vinh',
      returnId: 'route-vinh-hanoi',
      outward: {
        originCity: 'Hà Nội',
        destinationCity: 'Vinh',
        originAddress: 'Bến xe Nước Ngầm',
        destinationAddress: 'Bến xe Vinh',
      },
      distanceKm: 300,
      durationMinutes: 390,
      basePrice: 260000,
      vehicle: vehicles.haNoiVinh,
      vehicleType: sleeper40,
      driver: drivers.haNoiVinh,
      cycleTimes: ['07:00', '15:00', '23:00'],
    },
    {
      key: 'cantho-camau',
      operator: operators.mekong,
      outwardId: 'route-cantho-camau',
      returnId: 'route-camau-cantho',
      outward: {
        originCity: 'Cần Thơ',
        destinationCity: 'Cà Mau',
        originAddress: 'Bến xe trung tâm Cần Thơ',
        destinationAddress: 'Bến xe Cà Mau',
      },
      distanceKm: 180,
      durationMinutes: 240,
      basePrice: 180000,
      vehicle: vehicles.canThoCaMau,
      vehicleType: limousine22,
      driver: drivers.canThoCaMau,
      cycleTimes: ['06:00', '11:00', '16:00', '21:00'],
    },
    {
      key: 'hcm-danang',
      operator: operators.demo,
      outwardId: 'route-hcm-danang',
      returnId: 'route-danang-hcm',
      outward: { originCity: 'Hồ Chí Minh', destinationCity: 'Đà Nẵng', originAddress: 'Bến xe Miền Đông Mới', destinationAddress: 'Bến xe trung tâm Đà Nẵng' },
      distanceKm: 950, durationMinutes: 1200, basePrice: 450000,
      vehicle: vehicles.hcmDaNang, vehicleType: sleeper40, driver: drivers.hcmDaNang,
      cycleTimes: ['08:00', '18:00'],
    },
    {
      key: 'hanoi-danang',
      operator: operators.north,
      outwardId: 'route-hanoi-danang',
      returnId: 'route-danang-hanoi',
      outward: { originCity: 'Hà Nội', destinationCity: 'Đà Nẵng', originAddress: 'Bến xe Nước Ngầm', destinationAddress: 'Bến xe trung tâm Đà Nẵng' },
      distanceKm: 760, durationMinutes: 900, basePrice: 400000,
      vehicle: vehicles.hanoiDaNang, vehicleType: sleeper40, driver: drivers.hanoiDaNang,
      cycleTimes: ['09:00', '19:00'],
    },
    {
      key: 'hcm-hanoi-a',
      operator: operators.demo,
      outwardId: 'route-hcm-hanoi',
      returnId: 'route-hanoi-hcm',
      outward: { originCity: 'Hồ Chí Minh', destinationCity: 'Hà Nội', originAddress: 'Bến xe Miền Đông Mới', destinationAddress: 'Bến xe Nước Ngầm' },
      distanceKm: 1650, durationMinutes: 2040, basePrice: 780000,
      vehicle: vehicles.hcmHanoiA, vehicleType: sleeper40, driver: drivers.hcmHanoiA,
      cycleTimes: ['07:00', '19:00'],
      turnaroundMinutes: 120,
    },
    {
      key: 'hcm-hanoi-b',
      operator: operators.demo,
      outwardId: 'route-hcm-hanoi',
      returnId: 'route-hanoi-hcm',
      outward: { originCity: 'Hồ Chí Minh', destinationCity: 'Hà Nội', originAddress: 'Bến xe Miền Đông Mới', destinationAddress: 'Bến xe Nước Ngầm' },
      distanceKm: 1650, durationMinutes: 2040, basePrice: 820000,
      vehicle: vehicles.hcmHanoiB, vehicleType: sleeper40, driver: drivers.hcmHanoiB,
      cycleTimes: ['09:00', '21:00'],
      startsAtOrigin: false,
      turnaroundMinutes: 120,
    },
    {
      key: 'danang-nhatrang',
      operator: operators.central,
      outwardId: 'route-danang-nhatrang',
      returnId: 'route-nhatrang-danang',
      outward: { originCity: 'Đà Nẵng', destinationCity: 'Nha Trang', originAddress: 'Bến xe trung tâm Đà Nẵng', destinationAddress: 'Bến xe phía Nam Nha Trang' },
      distanceKm: 530, durationMinutes: 600, basePrice: 350000,
      vehicle: vehicles.daNangNhaTrang, vehicleType: limousine22, driver: drivers.daNangNhaTrang,
      cycleTimes: ['07:30', '20:30'],
    },
    {
      key: 'cantho-rachgia',
      operator: operators.western,
      outwardId: 'route-cantho-rachgia',
      returnId: 'route-rachgia-cantho',
      outward: { originCity: 'Cần Thơ', destinationCity: 'Kiên Giang', originAddress: 'Bến xe trung tâm Cần Thơ', destinationAddress: 'Bến xe Rạch Giá' },
      distanceKm: 110, durationMinutes: 150, basePrice: 130000,
      vehicle: vehicles.canThoRachGia, vehicleType: limousine22, driver: drivers.canThoRachGia,
      cycleTimes: ['06:00', '09:00', '12:00', '15:00', '18:00'],
    },
    {
      key: 'dalat-nhatrang',
      operator: operators.highland,
      outwardId: 'route-dalat-nhatrang',
      returnId: 'route-nhatrang-dalat',
      outward: { originCity: 'Đà Lạt', destinationCity: 'Nha Trang', originAddress: 'Bến xe liên tỉnh Đà Lạt', destinationAddress: 'Bến xe phía Nam Nha Trang' },
      distanceKm: 140, durationMinutes: 200, basePrice: 180000,
      vehicle: vehicles.daLatNhaTrang, vehicleType: limousine22, driver: drivers.daLatNhaTrang,
      cycleTimes: ['08:00', '13:00', '17:00'],
    },
    {
      key: 'haiphong-quangninh',
      operator: operators.eastern,
      outwardId: 'route-haiphong-quangninh',
      returnId: 'route-quangninh-haiphong',
      outward: { originCity: 'Hải Phòng', destinationCity: 'Quảng Ninh', originAddress: 'Bến xe Niệm Nghĩa', destinationAddress: 'Bến xe Bãi Cháy' },
      distanceKm: 80, durationMinutes: 100, basePrice: 100000,
      vehicle: vehicles.haiPhongQuangNinh, vehicleType: limousine22, driver: drivers.haiPhongQuangNinh,
      cycleTimes: ['06:30', '08:30', '10:30', '12:30', '14:30', '16:30', '18:30'],
    },
  ];

  const routeDefinitions = Array.from(new Map(corridorDefinitions.flatMap((corridor) => [
    {
      id: corridor.outwardId,
      operatorId: corridor.operator.id,
      originCity: corridor.outward.originCity,
      destinationCity: corridor.outward.destinationCity,
      originAddress: corridor.outward.originAddress,
      destinationAddress: corridor.outward.destinationAddress,
      distanceKm: corridor.distanceKm,
      durationMinutes: corridor.durationMinutes,
    },
    {
      id: corridor.returnId,
      operatorId: corridor.operator.id,
      originCity: corridor.outward.destinationCity,
      destinationCity: corridor.outward.originCity,
      originAddress: corridor.outward.destinationAddress,
      destinationAddress: corridor.outward.originAddress,
      distanceKm: corridor.distanceKm,
      durationMinutes: corridor.durationMinutes,
    },
  ]).map((route) => [route.id, route])).values());
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
        operatorId: routeData.operatorId,
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
        operatorId: routeData.operatorId,
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
  const planningHorizonDays = 60;

  for (const corridor of corridorDefinitions) {
    let vehicleAtOutwardOrigin = corridor.startsAtOrigin !== false;
    let vehicleAvailableAt = new Date(today);
    const turnaroundMinutes = corridor.turnaroundMinutes ?? 60;

    for (let dayOffset = 0; dayOffset < planningHorizonDays; dayOffset += 1) {
      const serviceDate = new Date(today);
      serviceDate.setDate(today.getDate() + dayOffset);

      for (const time of corridor.cycleTimes) {
        const [hour, minute] = time.split(':').map(Number);
        const departureTime = new Date(serviceDate);
        departureTime.setHours(hour, minute, 0, 0);

        if (departureTime < vehicleAvailableAt) continue;

        const routeId = vehicleAtOutwardOrigin ? corridor.outwardId : corridor.returnId;
        const route = routeById[routeId];
        const estimatedArrival = addMinutes(departureTime, corridor.durationMinutes);
        const tripId = `trip-${corridor.key}-${route.id}-${formatDateId(serviceDate)}-${time.replace(':', '')}`;

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

        vehicleAtOutwardOrigin = !vehicleAtOutwardOrigin;
        vehicleAvailableAt = addMinutes(estimatedArrival, turnaroundMinutes);
        tripCount += 1;
      }
    }
  }

  const createDemoTicket = async ({
    orderId,
    ticketId,
    tripId,
    seatCode,
    passengerName,
    passengerPhone,
    price,
    status,
    checkedInAt = null,
    review = null,
  }) => {
    const tripSeat = await prisma.tripSeat.findFirst({
      where: { tripId, seatLayout: { seatCode } },
      include: { seatLayout: true },
    });
    if (!tripSeat) return null;

    const order = await prisma.order.create({
      data: {
        id: orderId,
        customerId: customer.id,
        publicCode: createPublicCode('HD', orderId),
        totalAmount: price,
        status: 'PAID',
      },
    });

    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: price,
        method: 'BANK_CARD',
        gateway: 'DEMO',
        gatewayTxnId: `DEMO-${orderId}`,
        status: 'SUCCESS',
        paidAt: new Date(),
      },
    });

    const publicCode = createPublicCode('VE', ticketId);
    const qrData = createQrPayload({ ticketId, ticketCode: publicCode, tripId, seatId: tripSeat.id });
    const qrCode = await QRCode.toDataURL(qrData);

    const ticket = await prisma.ticketDetail.create({
      data: {
        id: ticketId,
        orderId: order.id,
        tripSeatId: tripSeat.id,
        publicCode,
        passengerName,
        passengerPhone,
        price,
        qrCode,
        status,
        checkedInAt,
      },
    });

    await prisma.tripSeat.update({
      where: { id: tripSeat.id },
      data: { status: 'BOOKED', lockedAt: null, lockedBy: null, lockExpiresAt: null },
    });

    if (review) {
      await prisma.review.create({
        data: {
          ticketDetailId: ticket.id,
          customerId: customer.id,
          rating: review.rating,
          comment: review.comment,
          isApproved: review.isApproved,
          approvedBy: review.isApproved ? adminUser.id : null,
        },
      });
    }

    return ticket;
  };

  const completedDeparture = new Date(today);
  completedDeparture.setDate(today.getDate() - 1);
  completedDeparture.setHours(8, 0, 0, 0);
  const completedArrival = addMinutes(completedDeparture, 510);
  const completedTrip = await prisma.trip.create({
    data: {
      id: 'trip-demo-completed-review-flow',
      routeId: 'route-hcm-nhatrang',
      vehicleId: vehicles.hcmNhaTrang.id,
      departureTime: completedDeparture,
      estimatedArrival: completedArrival,
      basePrice: 320000,
      status: 'COMPLETED',
    },
  });
  await ensureTripSeats(completedTrip.id, sleeper40.id);
  await prisma.tripStaff.create({
    data: { tripId: completedTrip.id, staffId: drivers.hcmNhaTrang.id, role: 'DRIVER' },
  });

  await createDemoTicket({
    orderId: 'order-demo-completed-needs-review',
    ticketId: 'ticket-demo-completed-needs-review',
    tripId: completedTrip.id,
    seatCode: 'A1',
    passengerName: 'Nguyen Minh An',
    passengerPhone: '0901234567',
    price: 320000,
    status: 'COMPLETED',
    checkedInAt: completedDeparture,
  });

  await createDemoTicket({
    orderId: 'order-demo-review-pending',
    ticketId: 'ticket-demo-review-pending',
    tripId: completedTrip.id,
    seatCode: 'B1',
    passengerName: 'Tran Hoai Nam',
    passengerPhone: '0902345678',
    price: 320000,
    status: 'COMPLETED',
    checkedInAt: completedDeparture,
    review: {
      rating: 5,
      comment: 'Xe sạch, tài xế chạy êm, hỗ trợ khách rất tốt.',
      isApproved: false,
    },
  });

  const upcomingDemoTrip = await prisma.trip.findFirst({
    where: {
      routeId: 'route-hcm-dalat',
      status: 'SCHEDULED',
      departureTime: { gt: new Date() },
    },
    orderBy: { departureTime: 'asc' },
  });
  if (upcomingDemoTrip) {
    await createDemoTicket({
      orderId: 'order-demo-paid-upcoming',
      ticketId: 'ticket-demo-paid-upcoming',
      tripId: upcomingDemoTrip.id,
      seatCode: 'A1',
      passengerName: 'Le Gia Bao',
      passengerPhone: '0903456789',
      price: 280000,
      status: 'PAID',
    });
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
