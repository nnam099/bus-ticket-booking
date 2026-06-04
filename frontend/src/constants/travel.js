export const cityOptions = [
  'Hồ Chí Minh',
  'Đà Lạt',
  'Nha Trang',
  'Cần Thơ',
  'Hà Nội',
  'Hải Phòng',
  'Đà Nẵng',
  'Huế',
  'Vũng Tàu',
  'Phan Thiết',
  'Buôn Ma Thuột',
  'Quy Nhơn',
  'Quảng Ngãi',
  'Lào Cai',
  'Ninh Bình',
  'Thanh Hóa',
  'Vinh',
  'Long Xuyen',
  'Soc Trang',
  'Bac Lieu',
  'Tay Ninh',
  'Dong Thap',
  'Bao Loc',
  'Sa Pa',
  'Ha Giang',
  'Hoi An',
  'Phan Rang',
  'Pleiku',
  'Cà Mau',
  'Kiên Giang',
  'Quảng Ninh',
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
