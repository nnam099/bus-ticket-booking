const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
const middleNames = ['Văn', 'Hữu', 'Minh', 'Đức', 'Xuân', 'Quang', 'Thịnh', 'Công', 'Thành', 'Tuấn', 'Ngọc', 'Quốc', 'Hải', 'Khắc', 'Đình'];
const lastNames = ['Anh', 'An', 'Bảo', 'Bằng', 'Cường', 'Dũng', 'Dương', 'Đạt', 'Đức', 'Hải', 'Hiếu', 'Hoàng', 'Huy', 'Hùng', 'Khang', 'Khánh', 'Khoa', 'Kiên', 'Lâm', 'Long', 'Minh', 'Nam', 'Phát', 'Phong', 'Phú', 'Phúc', 'Quân', 'Quang', 'Quốc', 'Sơn', 'Tài', 'Tâm', 'Thái', 'Thành', 'Thiện', 'Thịnh', 'Tiến', 'Tùng', 'Tuấn', 'Tú', 'Vinh', 'Việt', 'Vĩ'];

function getRandomName() {
  const f = firstNames[Math.floor(Math.random() * firstNames.length)];
  const m = middleNames[Math.floor(Math.random() * middleNames.length)];
  const l = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${f} ${m} ${l}`;
}

async function main() {
  const staffs = await prisma.staff.findMany();
  
  let count = 0;
  for (const s of staffs) {
    // Nếu tên chứa chữ số hoặc các từ khóa không giống tên người thật
    if (/\d/.test(s.fullName) || s.fullName.includes('Bổ sung')) {
      const newName = getRandomName();
      await prisma.staff.update({
        where: { id: s.id },
        data: { fullName: newName }
      });
      console.log(`Updated ${s.fullName} -> ${newName}`);
      count++;
    }
  }
  console.log(`Total updated: ${count}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
