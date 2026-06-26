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

// Cache layouts để tránh query lặp lại
const seatLayoutCache = {};
async function getSeatLayouts(vehicleTypeId) {
  if (!seatLayoutCache[vehicleTypeId]) {
    seatLayoutCache[vehicleTypeId] = await prisma.seatLayout.findMany({
      where: { vehicleTypeId },
      select: { id: true },
    });
  }
  return seatLayoutCache[vehicleTypeId];
}

async function main() {
  console.log('Starting seed...');

  const [adminRole, customerRole, operatorRole, staffRole] = await Promise.all([
    upsertRole('ADMIN', 'Quan tri he thong'),
    upsertRole('CUSTOMER', 'Khach hang'),
    upsertRole('BUS_OPERATOR', 'Nha xe'),
    upsertRole('STAFF', 'Nhan vien / Tai xe'),
  ]);

  const adminPassword = await bcrypt.hash(process.env.SEED_ADMIN_PWD || 'Admin@123', 10);
  const demoPassword = await bcrypt.hash(process.env.SEED_DEMO_PWD || 'Demo@123', 10);

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
      companyName: 'Hoàng Long',
      hotline: '1900 6064',
      address: '18 Phạm Hùng, Mỹ Đình, Hà Nội',
      description: 'Hãng xe giường nằm nổi tiếng nhất nhì Việt Nam trên tuyến Bắc - Nam. Phục vụ các chuyến đi đường dài Bắc - Trung - Nam với dòng xe giường nằm cao cấp.',
      isApproved: true,
      approvedAt: new Date(),
      approvedBy: adminUser.id,
    },
    create: {
      userId: operatorUser.id,
      companyName: 'Hoàng Long',
      licenseNumber: 'NX-DEMO-001',
      hotline: '1900 6064',
      address: '18 Phạm Hùng, Mỹ Đình, Hà Nội',
      description: 'Hãng xe giường nằm nổi tiếng nhất nhì Việt Nam trên tuyến Bắc - Nam. Phục vụ các chuyến đi đường dài Bắc - Trung - Nam với dòng xe giường nằm cao cấp.',
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
      companyName: 'Phương Trang (FUTA Bus Lines)',
      licenseNumber: 'NX-COAST-002',
      hotline: '1900 6067',
      address: '292 Đinh Tiên Hoàng, Bình Thạnh, TP. Hồ Chí Minh',
      description: 'Hãng xe được mệnh danh là "vua" các tuyến phía Nam và miền Trung. Phủ sóng hầu hết các tỉnh thành với hàng nghìn chuyến mỗi ngày.',
    }),
    mekong: await ensureOperator({
      email: 'operator.mekong@demo.vn',
      phone: '0900000022',
      companyName: 'Thành Bưởi',
      licenseNumber: 'NX-MEKONG-003',
      hotline: '1900 6068',
      address: '56 Trần Văn Giàu, Bình Chánh, TP. Hồ Chí Minh',
      description: 'Nhà xe nổi tiếng trên tuyến TP.HCM - Đà Lạt và TP.HCM - Cần Thơ. Nổi tiếng với dịch vụ chu đáo.',
    }),
    north: await ensureOperator({
      email: 'operator.north@demo.vn',
      phone: '0900000023',
      companyName: 'Sao Việt',
      licenseNumber: 'NX-NORTH-004',
      hotline: '1900 6066',
      address: '7 Phạm Hùng, Nam Từ Liêm, Hà Nội',
      description: 'Cực kỳ nổi tiếng trên tuyến Hà Nội - Lào Cai - Sapa. Sở hữu dàn xe giường nằm và cabin VIP (cung điện di động) rất hiện đại.',
    }),
    central: await ensureOperator({
      email: 'operator.central@demo.vn',
      phone: '0900000024',
      companyName: 'Hải Âu',
      licenseNumber: 'NX-CENTRAL-005',
      hotline: '1900 6069',
      address: '15 Điện Biên Phủ, Thanh Khê, Đà Nẵng',
      description: 'Chuyên cơ mặt đất thống lĩnh các tuyến miền Trung. Xe chạy liên tục, đúng giờ và không bắt khách dọc đường.',
    }),
    highland: await ensureOperator({
      email: 'operator.highland@demo.vn',
      phone: '0900000025',
      companyName: 'Tiến Oanh Limousine',
      licenseNumber: 'NX-HIGHLAND-006',
      hotline: '1900 6070',
      address: '42 Nguyễn Tất Thành, Buôn Ma Thuột, Đắk Lắk',
      description: 'Chuyên khai thác các tuyến từ TP.HCM đi Tây Nguyên (Đắk Lắk, Gia Lai) với các dòng xe phòng nằm limousine cao cấp.',
    }),
    eastern: await ensureOperator({
      email: 'operator.eastern@demo.vn',
      phone: '0900000026',
      companyName: 'Kumho Samco',
      licenseNumber: 'NX-EAST-007',
      hotline: '1900 6071',
      address: '196 Nguyễn Thái Học, Biên Hòa, Đồng Nai',
      description: 'Hãng xe liên doanh Hàn - Việt, rất uy tín trên các tuyến từ TP.HCM đi Vũng Tàu, Phan Thiết, Buôn Ma Thuột và miền Tây.',
    }),
    western: await ensureOperator({
      email: 'operator.western@demo.vn',
      phone: '0900000027',
      companyName: 'Tuấn Nga',
      licenseNumber: 'NX-WEST-008',
      hotline: '1900 6072',
      address: '88 Lê Duẩn, Rạch Giá, Kiên Giang',
      description: 'Nhà xe quen mặt chuyên chở khách từ TP.HCM về các tỉnh miền Tây như Cà Mau, Kiên Giang, Rạch Giá.',
    }),
    kingex: await ensureOperator({
      email: 'operator.kingex@demo.vn',
      phone: '0900000052',
      companyName: 'King Express Limousine',
      licenseNumber: 'NX-KING-009',
      hotline: '1900 6073',
      address: '32 Giải Phóng, Hoàng Mai, Hà Nội',
      description: 'Hãng xe limousine cao cấp chuyên khai thác tuyến Hà Nội - Lạng Sơn, Hà Nội - Thái Nguyên, Hà Nội - Điện Biên với xe cabin VIP hiện đại.',
    }),
    phuongnam: await ensureOperator({
      email: 'operator.phuongnam@demo.vn',
      phone: '0900000053',
      companyName: 'Phương Nam Travel',
      licenseNumber: 'NX-PNAM-010',
      hotline: '1900 6074',
      address: '125 Kinh Dương Vương, Bình Tân, TP. Hồ Chí Minh',
      description: 'Nhà xe chuyên tuyến TP.HCM đi các tỉnh đồng bằng sông Cửu Long như Mỹ Tho, Bến Tre, An Giang với xe limousine tiện nghi.',
    }),
    thanhlong: await ensureOperator({
      email: 'operator.thanhlong@demo.vn',
      phone: '0900000054',
      companyName: 'Thăng Long Express',
      licenseNumber: 'NX-TLONG-011',
      hotline: '1900 6075',
      address: '45 Trần Khát Chân, Hai Bà Trưng, Hà Nội',
      description: 'Hãng xe uy tín chuyên khai thác tuyến Hà Nội đi Nam Định, Thái Bình với tần suất cao và giá vé hợp lý.',
    }),
    dalatravel: await ensureOperator({
      email: 'operator.dalatravel@demo.vn',
      phone: '0900000055',
      companyName: 'Đà Lạt Travel',
      licenseNumber: 'NX-DLAT-012',
      hotline: '1900 6076',
      address: '1 Ngô Quyền, Phường 6, Đà Lạt, Lâm Đồng',
      description: 'Nhà xe lâu năm tại Đà Lạt, chuyên khai thác tuyến từ Đà Lạt đi Buôn Ma Thuột, Nha Trang và TP.HCM với dịch vụ cao cấp.',
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
    hcmLongXuyen: await ensureDriver({ email: 'driver.hcm_longxuyen@demo.vn', phone: '0900000036', fullName: 'Nguyen Van Hau', licenseNo: 'GPLX-DEMO-024', operator: operators.western }),
    hcmSocTrang: await ensureDriver({ email: 'driver.hcm_soctrang@demo.vn', phone: '0900000037', fullName: 'Tran Minh Khang', licenseNo: 'GPLX-DEMO-025', operator: operators.western }),
    hcmBacLieu: await ensureDriver({ email: 'driver.hcm_baclieu@demo.vn', phone: '0900000038', fullName: 'Le Thanh Phong', licenseNo: 'GPLX-DEMO-026', operator: operators.western }),
    hcmTayNinh: await ensureDriver({ email: 'driver.hcm_tayninh@demo.vn', phone: '0900000039', fullName: 'Pham Quoc Bao', licenseNo: 'GPLX-DEMO-027', operator: operators.coastal }),
    hcmDongThap: await ensureDriver({ email: 'driver.hcm_dongthap@demo.vn', phone: '0900000040', fullName: 'Vo Van Nam', licenseNo: 'GPLX-DEMO-028', operator: operators.mekong }),
    hcmBaoLoc: await ensureDriver({ email: 'driver.hcm_baoloc@demo.vn', phone: '0900000041', fullName: 'Dinh Thanh Tung', licenseNo: 'GPLX-DEMO-029', operator: operators.highland }),
    hanoiSapa: await ensureDriver({ email: 'driver.hanoi_sapa@demo.vn', phone: '0900000042', fullName: 'Bui Van Tien', licenseNo: 'GPLX-DEMO-030', operator: operators.north }),
    hanoiHaGiang: await ensureDriver({ email: 'driver.hanoi_hagiang@demo.vn', phone: '0900000043', fullName: 'Dang Van Khoa', licenseNo: 'GPLX-DEMO-031', operator: operators.north }),
    hanoiQuangNinh: await ensureDriver({ email: 'driver.hanoi_quangninh@demo.vn', phone: '0900000044', fullName: 'Hoang Minh Duc', licenseNo: 'GPLX-DEMO-032', operator: operators.eastern }),
    daNangHoiAn: await ensureDriver({ email: 'driver.danang_hoian@demo.vn', phone: '0900000045', fullName: 'Nguyen Van My', licenseNo: 'GPLX-DEMO-033', operator: operators.central }),
    nhaTrangPhanRang: await ensureDriver({ email: 'driver.nhatrang_phanrang@demo.vn', phone: '0900000046', fullName: 'Tran Van Ninh', licenseNo: 'GPLX-DEMO-034', operator: operators.coastal }),
    hcmPleiku: await ensureDriver({ email: 'driver.hcm_pleiku@demo.vn', phone: '0900000047', fullName: 'Pham Van Cao', licenseNo: 'GPLX-DEMO-035', operator: operators.highland }),
    hanoiLangSon: await ensureDriver({ email: 'driver.hanoi_langson@demo.vn', phone: '0900000048', fullName: 'Ly Van Son', licenseNo: 'GPLX-DEMO-036', operator: operators.kingex }),
    hanoiThaiNguyen: await ensureDriver({ email: 'driver.hanoi_thainguyen@demo.vn', phone: '0900000049', fullName: 'Duong Van Hung', licenseNo: 'GPLX-DEMO-037', operator: operators.kingex }),
    hanoiDienBien: await ensureDriver({ email: 'driver.hanoi_dienbien@demo.vn', phone: '0900000050', fullName: 'Cu A Sang', licenseNo: 'GPLX-DEMO-038', operator: operators.kingex }),
    hcmMyTho: await ensureDriver({ email: 'driver.hcm_mytho@demo.vn', phone: '0900000051', fullName: 'Nguyen Van Thong', licenseNo: 'GPLX-DEMO-039', operator: operators.phuongnam }),
    hcmBenTre: await ensureDriver({ email: 'driver.hcm_bentre@demo.vn', phone: '0900000056', fullName: 'Tran Van Xuan', licenseNo: 'GPLX-DEMO-040', operator: operators.phuongnam }),
    hcmAnGiang: await ensureDriver({ email: 'driver.hcm_angiang@demo.vn', phone: '0900000057', fullName: 'Huynh Minh Thanh', licenseNo: 'GPLX-DEMO-041', operator: operators.phuongnam }),
    hanoiNamDinh: await ensureDriver({ email: 'driver.hanoi_namdinh@demo.vn', phone: '0900000058', fullName: 'Tran Duc Nam', licenseNo: 'GPLX-DEMO-042', operator: operators.thanhlong }),
    hanoiThaiBinh: await ensureDriver({ email: 'driver.hanoi_thaibinh@demo.vn', phone: '0900000059', fullName: 'Nguyen Thanh Binh', licenseNo: 'GPLX-DEMO-043', operator: operators.thanhlong }),
    dalatBMT: await ensureDriver({ email: 'driver.dalat_bmt@demo.vn', phone: '0900000060', fullName: 'K So Rung', licenseNo: 'GPLX-DEMO-044', operator: operators.dalatravel }),
    daNangQuyNhon2: await ensureDriver({ email: 'driver.danang_quynhon2@demo.vn', phone: '0900000061', fullName: 'Vo Ngoc Thanh', licenseNo: 'GPLX-DEMO-045', operator: operators.central }),
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
    hcmLongXuyen: await ensureVehicle({ id: 'veh-demo-limo-hcm-longxuyen', vehicleType: limousine22, licensePlate: '67A-10101', manufactureYear: 2024, operator: operators.western }),
    hcmSocTrang: await ensureVehicle({ id: 'veh-demo-sleeper-hcm-soctrang', vehicleType: sleeper40, licensePlate: '83B-20202', manufactureYear: 2022, operator: operators.western }),
    hcmBacLieu: await ensureVehicle({ id: 'veh-demo-sleeper-hcm-baclieu', vehicleType: sleeper40, licensePlate: '94B-30303', manufactureYear: 2023, operator: operators.western }),
    hcmTayNinh: await ensureVehicle({ id: 'veh-demo-limo-hcm-tayninh', vehicleType: limousine22, licensePlate: '70A-40404', manufactureYear: 2024, operator: operators.coastal }),
    hcmDongThap: await ensureVehicle({ id: 'veh-demo-limo-hcm-dongthap', vehicleType: limousine22, licensePlate: '66A-50505', manufactureYear: 2023, operator: operators.mekong }),
    hcmBaoLoc: await ensureVehicle({ id: 'veh-demo-limo-hcm-baoloc', vehicleType: limousine22, licensePlate: '49C-60606', manufactureYear: 2024, operator: operators.highland }),
    hanoiSapa: await ensureVehicle({ id: 'veh-demo-sleeper-hanoi-sapa', vehicleType: sleeper40, licensePlate: '24B-70707', manufactureYear: 2023, operator: operators.north }),
    hanoiHaGiang: await ensureVehicle({ id: 'veh-demo-sleeper-hanoi-hagiang', vehicleType: sleeper40, licensePlate: '23B-80808', manufactureYear: 2022, operator: operators.north }),
    hanoiQuangNinh: await ensureVehicle({ id: 'veh-demo-limo-hanoi-quangninh', vehicleType: limousine22, licensePlate: '14A-90909', manufactureYear: 2024, operator: operators.eastern }),
    daNangHoiAn: await ensureVehicle({ id: 'veh-demo-limo-danang-hoian', vehicleType: limousine22, licensePlate: '92A-12121', manufactureYear: 2024, operator: operators.central }),
    nhaTrangPhanRang: await ensureVehicle({ id: 'veh-demo-limo-nhatrang-phanrang', vehicleType: limousine22, licensePlate: '85A-23232', manufactureYear: 2023, operator: operators.coastal }),
    hcmPleiku: await ensureVehicle({ id: 'veh-demo-sleeper-hcm-pleiku', vehicleType: sleeper40, licensePlate: '81B-34343', manufactureYear: 2022, operator: operators.highland }),
    hanoiLangSon: await ensureVehicle({ id: 'veh-demo-limo-hanoi-langson', vehicleType: limousine22, licensePlate: '29H-12345', manufactureYear: 2024, operator: operators.kingex }),
    hanoiThaiNguyen: await ensureVehicle({ id: 'veh-demo-limo-hanoi-thainguyen', vehicleType: limousine22, licensePlate: '29K-23456', manufactureYear: 2023, operator: operators.kingex }),
    hanoiDienBien: await ensureVehicle({ id: 'veh-demo-sleeper-hanoi-dienbien', vehicleType: sleeper40, licensePlate: '29L-34567', manufactureYear: 2022, operator: operators.kingex }),
    hcmMyTho: await ensureVehicle({ id: 'veh-demo-limo-hcm-mytho', vehicleType: limousine22, licensePlate: '51P-45678', manufactureYear: 2024, operator: operators.phuongnam }),
    hcmBenTre: await ensureVehicle({ id: 'veh-demo-limo-hcm-bentre', vehicleType: limousine22, licensePlate: '51Q-56789', manufactureYear: 2023, operator: operators.phuongnam }),
    hcmAnGiang: await ensureVehicle({ id: 'veh-demo-sleeper-hcm-angiang', vehicleType: sleeper40, licensePlate: '51R-67890', manufactureYear: 2022, operator: operators.phuongnam }),
    hanoiNamDinh: await ensureVehicle({ id: 'veh-demo-limo-hanoi-namdinh', vehicleType: limousine22, licensePlate: '29M-78901', manufactureYear: 2024, operator: operators.thanhlong }),
    hanoiThaiBinh: await ensureVehicle({ id: 'veh-demo-limo-hanoi-thaibinh', vehicleType: limousine22, licensePlate: '29N-89012', manufactureYear: 2023, operator: operators.thanhlong }),
    dalatBMT: await ensureVehicle({ id: 'veh-demo-limo-dalat-bmt', vehicleType: limousine22, licensePlate: '49D-90123', manufactureYear: 2024, operator: operators.dalatravel }),
    daNangQuyNhon2: await ensureVehicle({ id: 'veh-demo-sleeper-danang-quynhon2', vehicleType: sleeper40, licensePlate: '43E-01234', manufactureYear: 2022, operator: operators.central }),
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
    {
      key: 'hcm-longxuyen',
      operator: operators.western,
      outwardId: 'route-hcm-longxuyen',
      returnId: 'route-longxuyen-hcm',
      outward: { originCity: 'Hồ Chí Minh', destinationCity: 'Long Xuyen', originAddress: 'Báº¿n xe Miá»n TÃ¢y', destinationAddress: 'Bến xe Long Xuyên' },
      distanceKm: 190, durationMinutes: 270, basePrice: 190000,
      vehicle: vehicles.hcmLongXuyen, vehicleType: limousine22, driver: drivers.hcmLongXuyen,
      cycleTimes: ['06:00', '11:00', '16:00', '21:00'],
    },
    {
      key: 'hcm-soctrang',
      operator: operators.western,
      outwardId: 'route-hcm-soctrang',
      returnId: 'route-soctrang-hcm',
      outward: { originCity: 'Hồ Chí Minh', destinationCity: 'Soc Trang', originAddress: 'Báº¿n xe Miá»n TÃ¢y', destinationAddress: 'Bến xe Sóc Trăng' },
      distanceKm: 230, durationMinutes: 330, basePrice: 230000,
      vehicle: vehicles.hcmSocTrang, vehicleType: sleeper40, driver: drivers.hcmSocTrang,
      cycleTimes: ['07:00', '13:00', '19:00'],
    },
    {
      key: 'hcm-baclieu',
      operator: operators.western,
      outwardId: 'route-hcm-baclieu',
      returnId: 'route-baclieu-hcm',
      outward: { originCity: 'Hồ Chí Minh', destinationCity: 'Bac Lieu', originAddress: 'Báº¿n xe Miá»n TÃ¢y', destinationAddress: 'Bến xe Bạc Liêu' },
      distanceKm: 280, durationMinutes: 390, basePrice: 260000,
      vehicle: vehicles.hcmBacLieu, vehicleType: sleeper40, driver: drivers.hcmBacLieu,
      cycleTimes: ['06:30', '15:30', '22:00'],
    },
    {
      key: 'hcm-tayninh',
      operator: operators.coastal,
      outwardId: 'route-hcm-tayninh',
      returnId: 'route-tayninh-hcm',
      outward: { originCity: 'Hồ Chí Minh', destinationCity: 'Tay Ninh', originAddress: 'Bến xe An Sương', destinationAddress: 'Bến xe Tây Ninh' },
      distanceKm: 95, durationMinutes: 135, basePrice: 110000,
      vehicle: vehicles.hcmTayNinh, vehicleType: limousine22, driver: drivers.hcmTayNinh,
      cycleTimes: ['06:00', '09:00', '12:00', '15:00', '18:00'],
    },
    {
      key: 'hcm-dongthap',
      operator: operators.mekong,
      outwardId: 'route-hcm-dongthap',
      returnId: 'route-dongthap-hcm',
      outward: { originCity: 'Hồ Chí Minh', destinationCity: 'Dong Thap', originAddress: 'Báº¿n xe Miá»n TÃ¢y', destinationAddress: 'Bến xe Cao Lãnh' },
      distanceKm: 150, durationMinutes: 220, basePrice: 160000,
      vehicle: vehicles.hcmDongThap, vehicleType: limousine22, driver: drivers.hcmDongThap,
      cycleTimes: ['05:30', '10:30', '15:30', '20:30'],
    },
    {
      key: 'hcm-baoloc',
      operator: operators.highland,
      outwardId: 'route-hcm-baoloc',
      returnId: 'route-baoloc-hcm',
      outward: { originCity: 'Hồ Chí Minh', destinationCity: 'Bao Loc', originAddress: 'Báº¿n xe Miá»n ÄÃ´ng Má»›i', destinationAddress: 'Bến xe Bảo Lộc' },
      distanceKm: 190, durationMinutes: 300, basePrice: 220000,
      vehicle: vehicles.hcmBaoLoc, vehicleType: limousine22, driver: drivers.hcmBaoLoc,
      cycleTimes: ['06:00', '12:00', '18:00'],
    },
    {
      key: 'hanoi-sapa',
      operator: operators.north,
      outwardId: 'route-hanoi-sapa',
      returnId: 'route-sapa-hanoi',
      outward: { originCity: 'Hà Nội', destinationCity: 'Sa Pa', originAddress: 'Báº¿n xe Má»¹ ÄÃ¬nh', destinationAddress: 'Bến xe Sa Pa' },
      distanceKm: 315, durationMinutes: 390, basePrice: 320000,
      vehicle: vehicles.hanoiSapa, vehicleType: sleeper40, driver: drivers.hanoiSapa,
      cycleTimes: ['06:30', '14:30', '22:30'],
    },
    {
      key: 'hanoi-hagiang',
      operator: operators.north,
      outwardId: 'route-hanoi-hagiang',
      returnId: 'route-hagiang-hanoi',
      outward: { originCity: 'Hà Nội', destinationCity: 'Ha Giang', originAddress: 'Báº¿n xe Má»¹ ÄÃ¬nh', destinationAddress: 'Bến xe Hà Giang' },
      distanceKm: 300, durationMinutes: 420, basePrice: 300000,
      vehicle: vehicles.hanoiHaGiang, vehicleType: sleeper40, driver: drivers.hanoiHaGiang,
      cycleTimes: ['07:00', '20:00'],
    },
    {
      key: 'hanoi-quangninh',
      operator: operators.eastern,
      outwardId: 'route-hanoi-quangninh',
      returnId: 'route-quangninh-hanoi',
      outward: { originCity: 'Hà Nội', destinationCity: 'Quảng Ninh', originAddress: 'Bến xe Gia Lâm', destinationAddress: 'Bến xe Bãi Cháy' },
      distanceKm: 160,
      durationMinutes: 210,
      basePrice: 180000,
      vehicle: vehicles.hanoiQuangNinh,
      vehicleType: limousine22,
      driver: drivers.hanoiQuangNinh,
      cycleTimes: ['06:00', '10:00', '14:00', '18:00'],
    },
    {
      key: 'danang-hoian',
      operator: operators.central,
      outwardId: 'route-danang-hoian',
      returnId: 'route-hoian-danang',
      outward: { originCity: 'Đà Nẵng', destinationCity: 'Hoi An', originAddress: 'Bến xe trung tâm Đà Nẵng', destinationAddress: 'Bến xe Hội An' },
      distanceKm: 30,
      durationMinutes: 55,
      basePrice: 80000,
      vehicle: vehicles.daNangHoiAn,
      vehicleType: limousine22,
      driver: drivers.daNangHoiAn,
      cycleTimes: ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
    },
    {
      key: 'hcm-pleiku',
      operator: operators.highland,
      outwardId: 'route-hcm-pleiku',
      returnId: 'route-pleiku-hcm',
      outward: { originCity: 'Hồ Chí Minh', destinationCity: 'Pleiku', originAddress: 'Bến xe Miền Đông Mới', destinationAddress: 'Bến xe Đức Long Gia Lai' },
      distanceKm: 500,
      durationMinutes: 660,
      basePrice: 380000,
      vehicle: vehicles.hcmPleiku,
      vehicleType: sleeper40,
      driver: drivers.hcmPleiku,
      cycleTimes: ['07:00', '19:00'],
    },
    {
      key: 'hanoi-langson',
      operator: operators.kingex,
      outwardId: 'route-hanoi-langson',
      returnId: 'route-langson-hanoi',
      outward: { originCity: 'Hà Nội', destinationCity: 'Lạng Sơn', originAddress: 'Bến xe Gia Lâm', destinationAddress: 'Bến xe Lạng Sơn' },
      distanceKm: 155,
      durationMinutes: 200,
      basePrice: 170000,
      vehicle: vehicles.hanoiLangSon,
      vehicleType: limousine22,
      driver: drivers.hanoiLangSon,
      cycleTimes: ['06:00', '09:00', '13:00', '17:00'],
    },
    {
      key: 'hanoi-thainguyen',
      operator: operators.kingex,
      outwardId: 'route-hanoi-thainguyen',
      returnId: 'route-thainguyen-hanoi',
      outward: { originCity: 'Hà Nội', destinationCity: 'Thái Nguyên', originAddress: 'Bến xe Mỹ Đình', destinationAddress: 'Bến xe Thái Nguyên' },
      distanceKm: 80,
      durationMinutes: 100,
      basePrice: 100000,
      vehicle: vehicles.hanoiThaiNguyen,
      vehicleType: limousine22,
      driver: drivers.hanoiThaiNguyen,
      cycleTimes: ['06:30', '09:30', '12:30', '15:30', '18:30'],
    },
    {
      key: 'hanoi-dienbien',
      operator: operators.kingex,
      outwardId: 'route-hanoi-dienbien',
      returnId: 'route-dienbien-hanoi',
      outward: { originCity: 'Hà Nội', destinationCity: 'Điện Biên', originAddress: 'Bến xe Mỹ Đình', destinationAddress: 'Bến xe Điện Biên Phủ' },
      distanceKm: 480,
      durationMinutes: 600,
      basePrice: 380000,
      vehicle: vehicles.hanoiDienBien,
      vehicleType: sleeper40,
      driver: drivers.hanoiDienBien,
      cycleTimes: ['06:00', '18:00'],
    },
    {
      key: 'hcm-mytho',
      operator: operators.phuongnam,
      outwardId: 'route-hcm-mytho',
      returnId: 'route-mytho-hcm',
      outward: { originCity: 'Hồ Chí Minh', destinationCity: 'Mỹ Tho', originAddress: 'Bến xe Miền Tây', destinationAddress: 'Bến xe Mỹ Tho' },
      distanceKm: 70,
      durationMinutes: 90,
      basePrice: 90000,
      vehicle: vehicles.hcmMyTho,
      vehicleType: limousine22,
      driver: drivers.hcmMyTho,
      cycleTimes: ['05:30', '07:30', '09:30', '11:30', '13:30', '15:30', '17:30', '19:30'],
    },
    {
      key: 'hcm-bentre',
      operator: operators.phuongnam,
      outwardId: 'route-hcm-bentre',
      returnId: 'route-bentre-hcm',
      outward: { originCity: 'Hồ Chí Minh', destinationCity: 'Bến Tre', originAddress: 'Bến xe Miền Tây', destinationAddress: 'Bến xe Bến Tre' },
      distanceKm: 85,
      durationMinutes: 120,
      basePrice: 110000,
      vehicle: vehicles.hcmBenTre,
      vehicleType: limousine22,
      driver: drivers.hcmBenTre,
      cycleTimes: ['06:00', '09:00', '12:00', '15:00', '18:00'],
    },
    {
      key: 'hcm-angiang',
      operator: operators.phuongnam,
      outwardId: 'route-hcm-angiang',
      returnId: 'route-angiang-hcm',
      outward: { originCity: 'Hồ Chí Minh', destinationCity: 'An Giang', originAddress: 'Bến xe Miền Tây', destinationAddress: 'Bến xe Long Xuyên' },
      distanceKm: 200,
      durationMinutes: 300,
      basePrice: 210000,
      vehicle: vehicles.hcmAnGiang,
      vehicleType: sleeper40,
      driver: drivers.hcmAnGiang,
      cycleTimes: ['05:30', '10:30', '15:30', '20:30'],
    },
    {
      key: 'hanoi-namdinh',
      operator: operators.thanhlong,
      outwardId: 'route-hanoi-namdinh',
      returnId: 'route-namdinh-hanoi',
      outward: { originCity: 'Hà Nội', destinationCity: 'Nam Định', originAddress: 'Bến xe Giáp Bát', destinationAddress: 'Bến xe Nam Định' },
      distanceKm: 90,
      durationMinutes: 110,
      basePrice: 110000,
      vehicle: vehicles.hanoiNamDinh,
      vehicleType: limousine22,
      driver: drivers.hanoiNamDinh,
      cycleTimes: ['06:00', '09:00', '12:00', '15:00', '18:00'],
    },
    {
      key: 'hanoi-thaibinh',
      operator: operators.thanhlong,
      outwardId: 'route-hanoi-thaibinh',
      returnId: 'route-thaibinh-hanoi',
      outward: { originCity: 'Hà Nội', destinationCity: 'Thái Bình', originAddress: 'Bến xe Gia Lâm', destinationAddress: 'Bến xe Thái Bình' },
      distanceKm: 110,
      durationMinutes: 130,
      basePrice: 120000,
      vehicle: vehicles.hanoiThaiBinh,
      vehicleType: limousine22,
      driver: drivers.hanoiThaiBinh,
      cycleTimes: ['06:30', '09:30', '12:30', '15:30', '18:30'],
    },
    {
      key: 'dalat-buonmathuot',
      operator: operators.dalatravel,
      outwardId: 'route-dalat-buonmathuot',
      returnId: 'route-buonmathuot-dalat',
      outward: { originCity: 'Đà Lạt', destinationCity: 'Buôn Ma Thuột', originAddress: 'Bến xe liên tỉnh Đà Lạt', destinationAddress: 'Bến xe phía Bắc Buôn Ma Thuột' },
      distanceKm: 185,
      durationMinutes: 270,
      basePrice: 200000,
      vehicle: vehicles.dalatBMT,
      vehicleType: limousine22,
      driver: drivers.dalatBMT,
      cycleTimes: ['07:00', '13:00', '19:00'],
    },
    {
      key: 'danang-quynhon2',
      operator: operators.central,
      outwardId: 'route-danang-quynhon2',
      returnId: 'route-quynhon2-danang',
      outward: { originCity: 'Đà Nẵng', destinationCity: 'Quy Nhơn', originAddress: 'Bến xe trung tâm Đà Nẵng', destinationAddress: 'Bến xe Quy Nhơn' },
      distanceKm: 300,
      durationMinutes: 360,
      basePrice: 280000,
      vehicle: vehicles.daNangQuyNhon2,
      vehicleType: sleeper40,
      driver: drivers.daNangQuyNhon2,
      cycleTimes: ['06:30', '14:30', '22:30'],
    },
    {
      key: 'nhatrang-phanrang',
      operator: operators.coastal,
      outwardId: 'route-nhatrang-phanrang',
      returnId: 'route-phanrang-nhatrang',
      outward: { originCity: 'Nha Trang', destinationCity: 'Phan Rang', originAddress: 'Bến xe phía Nam Nha Trang', destinationAddress: 'Bến xe Phan Rang' },
      distanceKm: 105, durationMinutes: 150, basePrice: 120000,
      vehicle: vehicles.nhaTrangPhanRang, vehicleType: limousine22, driver: drivers.nhaTrangPhanRang,
      cycleTimes: ['06:30', '10:30', '14:30', '18:30'],
    },
    {
      key: 'hcm-pleiku',
      operator: operators.highland,
      outwardId: 'route-hcm-pleiku',
      returnId: 'route-pleiku-hcm',
      outward: { originCity: 'Hồ Chí Minh', destinationCity: 'Pleiku', originAddress: 'Báº¿n xe Miá»n ÄÃ´ng Má»›i', destinationAddress: 'Bến xe Đức Long Gia Lai' },
      distanceKm: 500, durationMinutes: 660, basePrice: 380000,
      vehicle: vehicles.hcmPleiku, vehicleType: sleeper40, driver: drivers.hcmPleiku,
      cycleTimes: ['07:00', '19:00'],
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

  console.log('Cleaning up old trips data...');
  // Dùng SQL trực tiếp để xóa nhanh hơn ORM (tránh N+1 với dataset lớn)
  await prisma.$executeRaw`
    DELETE FROM reviews
    WHERE ticket_detail_id IN (
      SELECT td.id FROM ticket_details td
      JOIN trip_seats ts ON td.trip_seat_id = ts.id
      JOIN trips t ON ts.trip_id = t.id
      WHERE t.route_id = ANY(${routeIds})
    )
  `;
  console.log('  ✓ reviews deleted');

  await prisma.$executeRaw`
    DELETE FROM payments
    WHERE order_id IN (
      SELECT DISTINCT o.id FROM orders o
      JOIN ticket_details td ON td.order_id = o.id
      JOIN trip_seats ts ON td.trip_seat_id = ts.id
      JOIN trips t ON ts.trip_id = t.id
      WHERE t.route_id = ANY(${routeIds})
    )
  `;
  console.log('  ✓ payments deleted');

  await prisma.$executeRaw`
    DELETE FROM ticket_details
    WHERE trip_seat_id IN (
      SELECT ts.id FROM trip_seats ts
      JOIN trips t ON ts.trip_id = t.id
      WHERE t.route_id = ANY(${routeIds})
    )
  `;
  console.log('  ✓ ticket_details deleted');

  await prisma.$executeRaw`DELETE FROM orders WHERE id NOT IN (SELECT DISTINCT order_id FROM ticket_details)`;
  console.log('  ✓ empty orders deleted');

  await prisma.$executeRaw`DELETE FROM trip_staffs WHERE trip_id IN (SELECT id FROM trips WHERE route_id = ANY(${routeIds}))`;
  console.log('  ✓ trip_staffs deleted');

  await prisma.$executeRaw`DELETE FROM trip_seats WHERE trip_id IN (SELECT id FROM trips WHERE route_id = ANY(${routeIds}))`;
  console.log('  ✓ trip_seats deleted');

  await prisma.$executeRaw`DELETE FROM trips WHERE route_id = ANY(${routeIds})`;
  console.log('  ✓ trips deleted');


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
  const pastDays = 14;
  const futureDays = 120;

  for (const corridor of corridorDefinitions) {
    const layouts = await getSeatLayouts(corridor.vehicleType.id);

    const allTripData = [];
    const allSeatData = [];
    const staffData = [];

    let currentStartTime = new Date(today);
    currentStartTime.setDate(today.getDate() - pastDays);
    if (corridor.cycleTimes && corridor.cycleTimes.length > 0) {
      const [h, m] = corridor.cycleTimes[0].split(':').map(Number);
      currentStartTime.setHours(h, m, 0, 0);
    } else {
      currentStartTime.setHours(6, 0, 0, 0);
    }

    let isOutward = true;
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + futureDays);

    while (currentStartTime < endDate) {
      // Sleep until 06:00 if the next departure is between 22:00 and 05:00
      if (currentStartTime.getHours() >= 22 || currentStartTime.getHours() < 5) {
        if (currentStartTime.getHours() >= 22) {
          currentStartTime.setDate(currentStartTime.getDate() + 1);
        }
        currentStartTime.setHours(6, 0, 0, 0);
      }

      const departureTime = new Date(currentStartTime);
      if (departureTime >= endDate) break;

      const estimatedArrival = addMinutes(departureTime, corridor.durationMinutes);
      const dateId = formatDateId(departureTime);
      const status = departureTime < new Date() ? 'COMPLETED' : 'SCHEDULED';
      
      const tripDirection = isOutward ? 'outward' : 'return';
      const routeId = isOutward ? corridor.outwardId : corridor.returnId;
      
      const hourStr = departureTime.getHours().toString().padStart(2, '0');
      const minStr = departureTime.getMinutes().toString().padStart(2, '0');
      const tripId = `trip-${corridor.key}-${tripDirection}-${dateId}-${hourStr}${minStr}`;

      allTripData.push({
        id: tripId,
        routeId: routeId,
        vehicleId: corridor.vehicle.id,
        departureTime,
        estimatedArrival,
        basePrice: corridor.basePrice,
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
        staffId: corridor.driver.id,
        role: 'DRIVER'
      });

      // Next trip starts after arrival + turnaround time (default 60 mins)
      currentStartTime = addMinutes(estimatedArrival, corridor.turnaroundMinutes || 60);
      isOutward = !isOutward;
    }

    const BATCH_SIZE = 500;
    
    // Batch insert Trips
    for (let i = 0; i < allTripData.length; i += BATCH_SIZE) {
      await prisma.trip.createMany({
        data: allTripData.slice(i, i + BATCH_SIZE),
        skipDuplicates: true,
      });
    }

    // Batch insert TripSeats
    for (let i = 0; i < allSeatData.length; i += BATCH_SIZE) {
      await prisma.tripSeat.createMany({
        data: allSeatData.slice(i, i + BATCH_SIZE),
        skipDuplicates: true,
      });
    }

    // Batch insert TripStaff
    for (let i = 0; i < staffData.length; i += BATCH_SIZE) {
      await prisma.tripStaff.createMany({
        data: staffData.slice(i, i + BATCH_SIZE),
        skipDuplicates: true,
      });
    }
    
    tripCount += allTripData.length;
    console.log(`  ✓ ${corridor.key}: ${allTripData.length} trips`);
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
  const completedTripLayouts = await getSeatLayouts(sleeper40.id);
  await prisma.tripSeat.createMany({
    data: completedTripLayouts.map((layout) => ({
      tripId: completedTrip.id,
      seatLayoutId: layout.id,
      status: 'AVAILABLE',
    })),
  });
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
