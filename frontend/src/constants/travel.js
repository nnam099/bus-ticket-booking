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
  'Cà Mau',
  'Kiên Giang',
  'Quảng Ninh',
];

export const popularRoutes = [
  {
    origin: 'Hồ Chí Minh',
    destination: 'Đà Lạt',
    price: 280000,
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=900&auto=format&fit=crop',
  },
  {
    origin: 'Hồ Chí Minh',
    destination: 'Nha Trang',
    price: 320000,
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=900&auto=format&fit=crop',
  },
  {
    origin: 'Hà Nội',
    destination: 'Lào Cai',
    price: 260000,
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=900&auto=format&fit=crop',
  },
  {
    origin: 'Đà Nẵng',
    destination: 'Huế',
    price: 140000,
    image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=900&auto=format&fit=crop',
  },
  {
    origin: 'Hồ Chí Minh',
    destination: 'Vũng Tàu',
    price: 120000,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=900&auto=format&fit=crop',
  },
  {
    origin: 'Hồ Chí Minh',
    destination: 'Cần Thơ',
    price: 180000,
    image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?q=80&w=900&auto=format&fit=crop',
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
