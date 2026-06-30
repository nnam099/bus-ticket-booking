export const cityOptions = [
  'An Giang',
  'Bạc Liêu',
  'Bảo Lộc',
  'Bến Tre',
  'Buôn Ma Thuột',
  'Cà Mau',
  'Cần Thơ',
  'Đồng Tháp',
  'Đà Lạt',
  'Đà Nẵng',
  'Điện Biên',
  'Hà Giang',
  'Hà Nội',
  'Hải Phòng',
  'Hội An',
  'Hồ Chí Minh',
  'Huế',
  'Kiên Giang',
  'Lạng Sơn',
  'Lào Cai',
  'Long Xuyên',
  'Mỹ Tho',
  'Nam Định',
  'Nha Trang',
  'Ninh Bình',
  'Phan Rang',
  'Phan Thiết',
  'Pleiku',
  'Quảng Ngãi',
  'Quảng Ninh',
  'Quy Nhơn',
  'Sa Pa',
  'Sóc Trăng',
  'Tây Ninh',
  'Thái Bình',
  'Thái Nguyên',
  'Thanh Hóa',
  'Vinh',
  'Vũng Tàu',
];

export const popularRoutes = [
  {
    origin: 'Hồ Chí Minh',
    destination: 'Đà Lạt',
    price: 280000,
    image: '/route-images/dalat-bus.jpg',
  },
  {
    origin: 'Hồ Chí Minh',
    destination: 'Nha Trang',
    price: 320000,
    image: '/route-images/nhatrang-bus.jpg',
  },
  {
    origin: 'Hà Nội',
    destination: 'Lào Cai',
    price: 260000,
    image: '/route-images/laocai-bus.jpg',
  },
  {
    origin: 'Đà Nẵng',
    destination: 'Huế',
    price: 140000,
    image: '/route-images/hue-bus.jpg',
  },
  {
    origin: 'Hồ Chí Minh',
    destination: 'Vũng Tàu',
    price: 120000,
    image: '/route-images/vungtau-bus.jpg',
  },
  {
    origin: 'Hồ Chí Minh',
    destination: 'Cần Thơ',
    price: 180000,
    image: '/route-images/cantho-bus.jpg',
  },
];


export const normalizeText = (value = '') =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');

export const findCity = (value) => {
  const normalizedValue = normalizeText(value);
  return cityOptions.find((city) => normalizeText(city) === normalizedValue);
};
