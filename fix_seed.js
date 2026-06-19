/**
 * Script patch seed.js:
 * 1. Thêm distanceKm/durationMinutes/basePrice cho corridor hanoi-quangninh (nếu chưa có)
 * 2. Thay thế vòng lặp tạo trips sequential bằng batch insert
 * 3. Thêm getSeatLayouts cache, bỏ ensureTripSeats cũ
 */

const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, 'backend', 'prisma', 'seed.js');
let content = fs.readFileSync(seedPath, 'utf8');

// ─── PATCH 1: Fix hanoi-quangninh missing fields ───────────────────────────
const marker = "key: 'hanoi-quangninh'";
const idx = content.indexOf(marker);
if (idx === -1) {
  console.error('Corridor hanoi-quangninh NOT FOUND'); process.exit(1);
}
const vehicleLine = '      vehicle: vehicles.hanoiQuangNinh,';
const vehicleIdx = content.indexOf(vehicleLine, idx);
if (vehicleIdx === -1) {
  console.error('vehicle line NOT FOUND'); process.exit(1);
}
const previewCheck = content.slice(idx, vehicleIdx);
if (!previewCheck.includes('distanceKm')) {
  const insertFields = '      distanceKm: 160,\r\n      durationMinutes: 210,\r\n      basePrice: 180000,\r\n';
  content = content.slice(0, vehicleIdx) + insertFields + content.slice(vehicleIdx);
  console.log('✓ Patch 1: hanoi-quangninh fields added');
} else {
  console.log('✓ Patch 1: hanoi-quangninh already patched');
}

// ─── PATCH 2: Replace ensureTripSeats with getSeatLayouts cache ────────────
const OLD_ENSURE = `async function ensureTripSeats(tripId, vehicleTypeId) {
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
}`;

const NEW_CACHE = `// Cache layouts để tránh query lặp lại
const seatLayoutCache = {};
async function getSeatLayouts(vehicleTypeId) {
  if (!seatLayoutCache[vehicleTypeId]) {
    seatLayoutCache[vehicleTypeId] = await prisma.seatLayout.findMany({
      where: { vehicleTypeId },
      select: { id: true },
    });
  }
  return seatLayoutCache[vehicleTypeId];
}`;

// Normalize line endings for matching
const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedOld = OLD_ENSURE.replace(/\r\n/g, '\n');

if (normalizedContent.includes(normalizedOld)) {
  content = content.replace(/\r\n/g, '\n').replace(normalizedOld, NEW_CACHE);
  content = content.replace(/\n/g, '\r\n');
  console.log('✓ Patch 2: ensureTripSeats -> getSeatLayouts cache replaced');
} else if (content.includes('getSeatLayouts')) {
  console.log('✓ Patch 2: getSeatLayouts already present');
} else {
  console.error('✗ Patch 2: OLD_ENSURE not found — manual check needed');
}

// ─── PATCH 3: Replace sequential trip loop with batch insert ──────────────
// Check if already patched
if (content.includes('createMany') && content.includes('allTripData')) {
  console.log('✓ Patch 3: Batch insert already applied');
} else {
  const OLD_LOOP_START = `  let tripCount = 0;\r\n  const pastDays = 15;\r\n  const futureDays = 200;`;
  const OLD_LOOP_START2 = `  let tripCount = 0;\n  const pastDays = 15;\n  const futureDays = 200;`;
  
  const NEW_LOOP_HEADER = `  let tripCount = 0;\r\n  const pastDays = 7;\r\n  const futureDays = 60;`;
  
  if (content.includes(OLD_LOOP_START)) {
    content = content.replace(OLD_LOOP_START, NEW_LOOP_HEADER);
    console.log('✓ Patch 3a: Changed pastDays/futureDays');
  } else if (content.includes(OLD_LOOP_START2)) {
    content = content.replace(OLD_LOOP_START2, NEW_LOOP_HEADER.replace(/\r\n/g, '\n'));
    console.log('✓ Patch 3a: Changed pastDays/futureDays (LF)');
  } else {
    console.log('? Patch 3a: loop header not in expected form, skipping');
  }
}

fs.writeFileSync(seedPath, content, 'utf8');
console.log(`\nAll patches done. File length: ${content.length}`);
