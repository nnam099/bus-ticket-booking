const fs = require('fs');
let content = fs.readFileSync('backend/prisma/seed.js', 'utf-8');
const map = {
  'Há»“ ChÃ­ Minh': 'Hồ Chí Minh',
  'Báº¿n xe Miá» n TÃ¢y': 'Bến xe Miền Tây',
  'Báº¿n xe Miá» n Ä Ã´ng Má»›i': 'Bến xe Miền Đông Mới',
  'HÃ  Ná»™i': 'Hà Nội',
  'HÃ Ná»™i': 'Hà Nội',
  'Báº¿n xe Má»¹ Ä Ã¬nh': 'Bến xe Mỹ Đình',
  'Quáº£ng Ninh': 'Quảng Ninh',
  'Báº¿n xe Gia LÃ¢m': 'Bến xe Gia Lâm',
  'Báº¿n xe BÃ£i ChÃ¡y': 'Bến xe Bãi Cháy',
  'Báº¿n xe An Suong': 'Bến xe An Sương',
  'Báº¿n xe phÃ­a Nam Nha Trang': 'Bến xe phía Nam Nha Trang',
  'Ben xe Duc Long Gia Lai': 'Bến xe Đức Long Gia Lai',
  'Ben xe Phan Rang': 'Bến xe Phan Rang',
  'Ben xe Long Xuyen': 'Bến xe Long Xuyên',
  'Ben xe Soc Trang': 'Bến xe Sóc Trăng',
  'Ben xe Bac Lieu': 'Bến xe Bạc Liêu',
  'Ben xe Tay Ninh': 'Bến xe Tây Ninh',
  'Ben xe Cao Lanh': 'Bến xe Cao Lãnh',
  'Ben xe Bao Loc': 'Bến xe Bảo Lộc',
  'Ben xe Sa Pa': 'Bến xe Sa Pa',
  'Ben xe Ha Giang': 'Bến xe Hà Giang',
  'Ben xe Hoi An': 'Bến xe Hội An'
};
for (const [k, v] of Object.entries(map)) {
  content = content.split(k).join(v);
}
fs.writeFileSync('backend/prisma/seed.js', content);
console.log('Encoding fixed.');
