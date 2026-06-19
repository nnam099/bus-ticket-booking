import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setSearchParams } from '../store/slices/tripSlice';
import { format } from 'date-fns';
import { cityOptions, findCity, normalizeText } from '../constants/travel';

// ─── City Suggest Input ───────────────────────────────────────────────────────
function CitySuggestInput({ label, icon, placeholder, value, onInputChange, onSelect }) {
  const [focused, setFocused] = useState(false);
  const query = normalizeText(value.trim());
  const suggestions = cityOptions.filter((city) => !query || normalizeText(city).includes(query));

  return (
    <div className="relative flex-1 px-5 py-4" style={{ borderRight: '1.5px solid #f0e6d8' }}>
      <div
        className="text-xs font-bold uppercase mb-1.5"
        style={{ color: '#e85d04', letterSpacing: '0.8px' }}
      >
        {label}
      </div>
      <div className="flex items-center gap-2">
        <i className={`ti ${icon}`} style={{ color: focused || value ? '#e85d04' : '#c4a898', fontSize: 18 }} />
        <input
          className="bg-transparent border-none outline-none text-base font-semibold w-full"
          style={{ color: value ? '#4a3b32' : '#c4a898' }}
          placeholder={placeholder}
          value={value}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onChange={(e) => onInputChange(e.target.value)}
          autoComplete="off"
          required
        />
      </div>
      {focused && suggestions.length > 0 && (
        <div
          className="absolute z-30 mt-3 w-64 overflow-hidden rounded-2xl bg-white"
          style={{ top: '100%', left: 0, boxShadow: '0 8px 32px rgba(74,59,50,0.15)', border: '1.5px solid #f0e6d8' }}
        >
          {suggestions.slice(0, 8).map((city) => (
            <button
              key={city}
              type="button"
              className="w-full px-4 py-3 text-left text-sm font-semibold transition-colors hover:bg-peach"
              style={{ color: '#4a3b32' }}
              onMouseDown={() => onSelect(city)}
            >
              <i className="ti ti-map-pin mr-2" style={{ color: '#e85d04', fontSize: 14 }} />
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Wave Divider ─────────────────────────────────────────────────────────────
function WaveDivider({ fill }) {
  return (
    <div className="w-full overflow-hidden" style={{ lineHeight: 0, transform: 'translateY(-1px)' }}>
      <svg viewBox="0 0 1440 48" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: 48 }} fill={fill}>
        <path d="M0,24 C360,48 1080,0 1440,24 L1440,0 L0,0 Z" />
      </svg>
    </div>
  );
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const DESTINATIONS = [
  {
    name: 'Vịnh Hạ Long',
    region: '🌊 Miền Bắc',
    regionColor: '#2d6a4f',
    desc: 'Di sản thiên nhiên thế giới · 🚌 5h từ Hà Nội',
    rating: '4.9',
    img: 'https://images.pexels.com/photos/6877795/pexels-photo-6877795.jpeg?auto=compress&cs=tinysrgb&w=600&q=80',
    origin: 'Hà Nội',
    dest: 'Quảng Ninh',
  },
  {
    name: 'Đà Lạt',
    region: '🌿 Tây Nguyên',
    regionColor: '#2d6a4f',
    desc: 'Thành phố sương mù · 🚌 7h từ TP.HCM',
    rating: '4.8',
    img: 'https://images.pexels.com/photos/2582597/pexels-photo-2582597.jpeg?auto=compress&cs=tinysrgb&w=600&q=80',
    origin: 'Hồ Chí Minh',
    dest: 'Đà Lạt',
  },
  {
    name: 'Hội An',
    region: '🏮 Miền Trung',
    regionColor: '#e85d04',
    desc: 'Phố cổ lung linh · 🚌 4h từ Đà Nẵng',
    rating: '4.9',
    img: 'https://images.unsplash.com/photo-1679033746255-1acf0c86fd11?auto=format&w=600&q=80&fit=crop',
    origin: 'Đà Nẵng',
    dest: 'Hoi An',
  },
  {
    name: 'Nha Trang',
    region: '🏖️ Miền Nam',
    regionColor: '#2d6a4f',
    desc: 'Biển xanh cát trắng · 🚌 9h từ Hà Nội',
    rating: '4.7',
    img: 'https://images.pexels.com/photos/983242/pexels-photo-983242.png?auto=compress&cs=tinysrgb&w=600&q=80',
    origin: 'Hồ Chí Minh',
    dest: 'Nha Trang',
  },
];

const ACTIVITY_FEED = [
  { avatar: 'https://i.pravatar.cc/40?u=user1', name: 'Nguyễn V. A', seats: 2, route: 'Hà Nội → Đà Nẵng', time: '2 phút trước' },
  { avatar: 'https://i.pravatar.cc/40?u=user2', name: 'Trần T. B', seats: 1, route: 'TP.HCM → Đà Lạt', time: '5 phút trước' },
  { avatar: 'https://i.pravatar.cc/40?u=user3', name: 'Lê V. C', seats: 3, route: 'Huế → Hội An', time: '12 phút trước' },
  { avatar: 'https://i.pravatar.cc/40?u=user4', name: 'Phạm T. D', seats: 2, route: 'Hà Nội → Sapa', time: '18 phút trước' },
  { avatar: 'https://i.pravatar.cc/40?u=user5', name: 'Hoàng V. E', seats: 1, route: 'Nha Trang → Đà Lạt', time: '25 phút trước' },
];

const WHY_CARDS = [
  { emoji: '🚌', title: 'Chọn ghế yêu thích', desc: 'Tự chọn vị trí ghế ngồi thoải mái theo sở thích', bg: '#fff0e6' },
  { emoji: '💳', title: 'Thanh toán siêu tốc', desc: 'Đa dạng hình thức, an toàn và bảo mật tuyệt đối', bg: '#e8f5ee' },
  { emoji: '📍', title: 'Theo dõi xe thời gian thực', desc: 'Biết chính xác xe đang ở đâu, không cần đợi chờ', bg: '#fff0e6' },
  { emoji: '🎫', title: 'Hoàn vé không rắc rối', desc: 'Đổi hoặc hoàn vé trong 24h, không câu hỏi thêm', bg: '#e8f5ee' },
];

const TESTIMONIALS = [
  {
    quote: '"Đặt vé cực kỳ tiện lợi! Chỉ cần vài phút là xong. Chọn ghế, thanh toán qua MoMo, nhận vé ngay. Sẽ dùng BusGo mãi thôi!"',
    name: 'Nguyễn Thị Mai',
    sub: 'Hà Nội · 12 chuyến',
    avatar: 'https://i.pravatar.cc/48?u=testimonial1',
  },
  {
    quote: '"Tính năng theo dõi xe thật sự tuyệt vời. Biết xe đến bao giờ nên không cần ra sớm chờ. BusGo thay đổi cách tôi đi du lịch!"',
    name: 'Trần Minh Khoa',
    sub: 'TP.HCM · 8 chuyến',
    avatar: 'https://i.pravatar.cc/48?u=testimonial2',
  },
  {
    quote: '"Hoàn vé dễ dàng, không cần phải giải thích lý do. Đội ngũ hỗ trợ rất thân thiện. Đây là ứng dụng đặt vé tốt nhất tôi từng dùng!"',
    name: 'Lê Phương Linh',
    sub: 'Đà Nẵng · 20 chuyến',
    avatar: 'https://i.pravatar.cc/48?u=testimonial3',
  },
];

const PARTNERS = [
  { name: 'Phương Trang', color: '#e85d04' },
  { name: 'Hoàng Long', color: '#2d6a4f' },
  { name: 'Thành Bưởi', color: '#e85d04' },
  { name: 'Kumho Samco', color: '#2d6a4f' },
  { name: 'Sao Việt', color: '#e85d04' },
  { name: 'Việt Tân Phát', color: '#2d6a4f' },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const today = format(new Date(), 'yyyy-MM-dd');

  const [form, setForm] = useState({ origin: '', destination: '', date: today });
  const [selectedCity, setSelectedCity] = useState({ origin: '', destination: '' });

  const handleSearch = (e) => {
    e.preventDefault();
    if (!form.origin || !form.destination || !form.date) return;

    const validOrigin = findCity(form.origin);
    const validDest = findCity(form.destination);

    if (!validOrigin || selectedCity.origin !== validOrigin) {
      alert('Vui lòng chọn Điểm đi hợp lệ từ danh sách gợi ý.');
      return;
    }
    if (!validDest || selectedCity.destination !== validDest) {
      alert('Vui lòng chọn Điểm đến hợp lệ từ danh sách gợi ý.');
      return;
    }
    if (normalizeText(validOrigin) === normalizeText(validDest)) {
      alert('Điểm đi và điểm đến phải là hai thành phố khác nhau.');
      return;
    }

    const searchForm = { ...form, origin: validOrigin, destination: validDest };
    dispatch(setSearchParams(searchForm));
    navigate(
      `/search?origin=${encodeURIComponent(validOrigin)}&destination=${encodeURIComponent(validDest)}&date=${form.date}`
    );
  };

  const handleQuickRoute = (origin, dest) => {
    navigate(`/search?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}&date=${today}`);
  };

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: '#fdfbf7' }}>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-x-clip"
        style={{ background: '#fdfbf7', padding: '88px 24px 96px' }}
      >
        {/* Blob decorations */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{ top: -180, left: -140, width: 700, height: 700, background: 'radial-gradient(circle, rgba(255,204,153,0.55) 0%, transparent 65%)' }}
        />
        <div
          className="absolute rounded-full pointer-events-none"
          style={{ top: 60, right: -180, width: 600, height: 600, background: 'radial-gradient(circle, rgba(255,224,204,0.6) 0%, transparent 65%)' }}
        />
        <div
          className="absolute rounded-full pointer-events-none"
          style={{ bottom: -100, left: '35%', width: 450, height: 450, background: 'radial-gradient(circle, rgba(255,214,179,0.55) 0%, transparent 65%)' }}
        />

        <div className="relative z-10 text-center max-w-5xl mx-auto">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold mb-6"
            style={{ background: '#fff0e6', color: '#e85d04', border: '1.5px solid #f5c7a0', fontFamily: "'Quicksand', sans-serif" }}
          >
            🇻🇳 Khám phá Việt Nam cùng BusGo
          </div>

          {/* Heading */}
          <h1
            className="mb-4"
            style={{
              fontFamily: "'Quicksand', sans-serif",
              fontSize: 'clamp(44px, 5vw, 68px)',
              fontWeight: 700,
              color: '#4a3b32',
              lineHeight: 1.1,
              margin: '0 0 16px',
            }}
          >
            Đặt vé xe khách
            <br />
            <span style={{ color: '#e85d04' }}>nhanh &amp; dễ dàng 🚌</span>
          </h1>
          <p className="mb-12" style={{ color: '#9a7d6e', fontSize: 19, fontWeight: 600 }}>
            Hơn 200+ tuyến đường · Giá tốt nhất · Đặt ngay hôm nay 🎉
          </p>

          {/* Search widget */}
          <form
            onSubmit={handleSearch}
            className="mx-auto rounded-3xl"
            style={{
              maxWidth: 960,
              background: '#fff',
              padding: 16,
              boxShadow: '0 24px 80px rgba(232,93,4,0.13), 0 4px 24px rgba(74,59,50,0.07)',
            }}
          >
            <div
              className="text-left px-4 pb-3 font-bold"
              style={{ fontFamily: "'Quicksand', sans-serif", fontSize: 20, color: '#4a3b32' }}
            >
              Đi đâu hôm nay? 🌟
            </div>
            <div
              className="flex items-center rounded-2xl flex-wrap md:flex-nowrap"
              style={{ background: '#fdfbf7' }}
            >
              {/* Origin */}
              <CitySuggestInput
                label="Điểm đi"
                icon="ti-map-pin"
                placeholder="Hà Nội"
                value={form.origin}
                onInputChange={(origin) => {
                  setForm({ ...form, origin });
                  setSelectedCity({ ...selectedCity, origin: '' });
                }}
                onSelect={(origin) => {
                  setForm({ ...form, origin });
                  setSelectedCity({ ...selectedCity, origin });
                }}
              />

              {/* Swap icon */}
              <div className="px-3 shrink-0">
                <div
                  className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer transition-colors hover:bg-peach"
                  style={{ background: '#fff0e6' }}
                  onClick={() => {
                    setForm({ ...form, origin: form.destination, destination: form.origin });
                    setSelectedCity({ origin: selectedCity.destination, destination: selectedCity.origin });
                  }}
                >
                  <i className="ti ti-arrows-right-left" style={{ color: '#e85d04', fontSize: 15 }} />
                </div>
              </div>

              {/* Destination */}
              <CitySuggestInput
                label="Điểm đến"
                icon="ti-map-pin-filled"
                placeholder="Chọn điểm đến"
                value={form.destination}
                onInputChange={(destination) => {
                  setForm({ ...form, destination });
                  setSelectedCity({ ...selectedCity, destination: '' });
                }}
                onSelect={(destination) => {
                  setForm({ ...form, destination });
                  setSelectedCity({ ...selectedCity, destination });
                }}
              />

              {/* Date */}
              <div className="relative flex-1 px-5 py-4" style={{ borderRight: '1.5px solid #f0e6d8' }}>
                <div className="text-xs font-bold uppercase mb-1.5" style={{ color: '#e85d04', letterSpacing: '0.8px' }}>
                  Ngày đi
                </div>
                <div className="flex items-center gap-2">
                  <i className="ti ti-calendar" style={{ color: '#c4a898', fontSize: 18 }} />
                  <input
                    type="date"
                    className="bg-transparent border-none outline-none text-base font-semibold w-full"
                    style={{ color: '#4a3b32', colorScheme: 'light' }}
                    min={today}
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Passenger */}
              <div className="relative flex-1 px-5 py-4">
                <div className="text-xs font-bold uppercase mb-1.5" style={{ color: '#e85d04', letterSpacing: '0.8px' }}>
                  Hành khách
                </div>
                <div className="flex items-center gap-2">
                  <i className="ti ti-users" style={{ color: '#c4a898', fontSize: 18 }} />
                  <span className="text-base font-semibold" style={{ color: '#4a3b32' }}>
                    1 người
                  </span>
                </div>
              </div>

              {/* Search button */}
              <div className="px-3 py-3 shrink-0">
                <button
                  type="submit"
                  className="w-14 h-14 flex items-center justify-center rounded-full border-0 transition-all hover:opacity-90 hover:scale-105"
                  style={{ background: '#e85d04', boxShadow: '0 8px 28px rgba(232,93,4,0.45)', cursor: 'pointer' }}
                >
                  <i className="ti ti-search text-white" style={{ fontSize: 22 }} />
                </button>
              </div>
            </div>
          </form>

          {/* Quick route chips */}
          <div className="flex flex-wrap gap-3 justify-center mt-7">
            {[
              { label: 'Hà Nội → Đà Nẵng 🌊', origin: 'Hà Nội', dest: 'Đà Nẵng' },
              { label: 'TP.HCM → Đà Lạt 🌿', origin: 'Hồ Chí Minh', dest: 'Đà Lạt' },
              { label: 'Huế → Hội An 🏮', origin: 'Huế', dest: 'Hoi An' },
            ].map(({ label, origin, dest }) => (
              <button
                key={label}
                type="button"
                onClick={() => handleQuickRoute(origin, dest)}
                className="flex items-center gap-2 text-sm font-bold cursor-pointer rounded-full px-5 py-2.5 transition-all hover:bg-peach"
                style={{
                  background: '#fff',
                  border: '1.5px solid #f0e6d8',
                  color: '#4a3b32',
                  boxShadow: '0 2px 12px rgba(74,59,50,0.07)',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Mini stats */}
          <div className="flex items-center justify-center gap-8 mt-10 flex-wrap">
            {[
              { icon: 'ti-bus', label: 'Tuyến đường', value: '200+', bg: '#fff0e6', color: '#e85d04' },
              { icon: 'ti-users', label: 'Hành khách', value: '2M+', bg: '#e8f5ee', color: '#2d6a4f' },
              { icon: 'ti-star-filled', label: 'Đánh giá', value: '4.9★', bg: '#fff0e6', color: '#e85d04' },
              { icon: 'ti-shield-check', label: 'Bảo mật', value: '100%', bg: '#e8f5ee', color: '#2d6a4f' },
            ].map(({ icon, label, value, bg, color }, idx, arr) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: bg }}>
                  <i className={`ti ${icon}`} style={{ color, fontSize: 18 }} />
                </div>
                <div className="text-left">
                  <div
                    className="text-lg font-bold"
                    style={{ color: '#4a3b32', fontFamily: "'Quicksand', sans-serif" }}
                  >
                    {value}
                  </div>
                  <div className="text-xs" style={{ color: '#9a7d6e' }}>
                    {label}
                  </div>
                </div>
                {idx < arr.length - 1 && (
                  <div className="w-px h-10 ml-5" style={{ background: '#f0e6d8' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Destinations Gallery ─────────────────────────────────────────────── */}
      <section className="py-20 px-6 relative" style={{ background: '#fff0e6' }}>
        <WaveDivider fill="#fdfbf7" />

        <div className="max-w-7xl mx-auto mt-4">
          <div className="text-center mb-12">
            <span
              className="inline-block px-5 py-2 rounded-full text-sm font-bold mb-4"
              style={{ background: '#fff', color: '#e85d04', border: '1.5px solid #f5c7a0', fontFamily: "'Quicksand', sans-serif" }}
            >
              ✈️ Điểm đến nổi bật
            </span>
            <h2
              style={{
                fontFamily: "'Quicksand', sans-serif",
                fontSize: 'clamp(32px, 4vw, 46px)',
                fontWeight: 700,
                color: '#4a3b32',
                margin: '0 0 10px',
              }}
            >
              Khám phá Việt Nam
            </h2>
            <p style={{ color: '#9a7d6e', fontSize: 16, fontWeight: 600 }}>
              Mỗi chuyến đi là một câu chuyện mới 🌏
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {DESTINATIONS.map((dest) => (
              <div
                key={dest.name}
                className="rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                style={{ background: '#fff', boxShadow: '0 8px 40px rgba(74,59,50,0.1)' }}
              >
                <div className="relative" style={{ height: 240, overflow: 'hidden' }}>
                  <img
                    src={dest.img}
                    alt={dest.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(to top, rgba(74,59,50,0.4) 0%, transparent 60%)' }}
                  />
                  <div
                    className="absolute top-3 right-3 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: 'white', color: '#e85d04' }}
                  >
                    ⭐ {dest.rating}
                  </div>
                  <div className="absolute bottom-3 left-4">
                    <span
                      className="text-xs px-2 py-1 rounded-full font-bold"
                      style={{ background: 'rgba(255,255,255,0.9)', color: dest.regionColor }}
                    >
                      {dest.region}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3
                    style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, color: '#4a3b32', fontSize: 19, margin: '0 0 5px' }}
                  >
                    {dest.name}
                  </h3>
                  <p style={{ color: '#9a7d6e', fontSize: 13, margin: '0 0 14px', lineHeight: 1.5 }}>
                    {dest.desc}
                  </p>
                  <button
                    className="w-full py-2.5 rounded-full text-sm font-bold transition-all hover:bg-brand hover:text-white"
                    style={{ background: '#fff0e6', color: '#e85d04', border: 'none', cursor: 'pointer' }}
                    onClick={() => handleQuickRoute(dest.origin, dest.dest)}
                  >
                    Tìm chuyến →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Activity Feed + Why BusGo ────────────────────────────────────────── */}
      <section className="py-20 px-6 relative" style={{ background: '#fdfbf7' }}>
        <WaveDivider fill="#fff0e6" />

        <div className="max-w-7xl mx-auto mt-4 grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Activity Feed */}
          <div
            className="rounded-3xl p-8"
            style={{ background: '#fff', boxShadow: '0 8px 40px rgba(74,59,50,0.08)' }}
          >
            <div className="flex items-center gap-4 mb-7">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: '#fff0e6' }}>
                📡
              </div>
              <div>
                <h3 style={{ fontFamily: "'Quicksand', sans-serif", fontSize: 22, fontWeight: 700, color: '#4a3b32', margin: 0 }}>
                  Hoạt động gần đây
                </h3>
                <p className="text-sm font-semibold" style={{ color: '#9a7d6e', margin: 0 }}>
                  Đang cập nhật ·{' '}
                  <span style={{ color: '#2d6a4f' }}>● Trực tiếp</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {ACTIVITY_FEED.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-3 p-3 rounded-2xl transition-colors hover:bg-peach"
                  style={{ background: '#fdfbf7' }}
                >
                  <img
                    src={item.avatar}
                    className="rounded-full shrink-0"
                    style={{ width: 40, height: 40, border: '2px solid #fff0e6' }}
                    loading="lazy"
                    decoding="async"
                    alt={item.name}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold mb-0.5" style={{ color: '#4a3b32', margin: 0 }}>
                      📍 {item.name}{' '}
                      <span style={{ fontWeight: 500 }}>vừa đặt {item.seats} ghế</span>
                    </p>
                    <p className="text-xs font-bold" style={{ color: '#e85d04', margin: 0 }}>
                      {item.route}
                    </p>
                  </div>
                  <span className="text-xs shrink-0" style={{ color: '#c4a898' }}>
                    {item.time}
                  </span>
                </div>
              ))}
            </div>

            {/* Live indicator */}
            <div
              className="mt-6 p-4 rounded-2xl flex items-center gap-3"
              style={{ background: 'linear-gradient(135deg, #fff0e6, #fff8f2)', border: '1.5px solid #f5c7a0' }}
            >
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: '#2d6a4f', display: 'inline-block', animation: 'pulse 2s infinite' }}
                />
                <span className="text-xs font-bold" style={{ color: '#2d6a4f' }}>LIVE</span>
              </div>
              <div style={{ width: 1, height: 20, background: '#f0e6d8' }} />
              <p className="text-sm font-semibold" style={{ color: '#4a3b32', margin: 0 }}>
                Hiện có <strong style={{ color: '#e85d04' }}>1,284 khách hàng</strong> đang tìm chuyến đi
              </p>
            </div>
          </div>

          {/* Why BusGo */}
          <div>
            <div className="mb-7">
              <span
                className="inline-block px-5 py-2 rounded-full text-sm font-bold mb-4"
                style={{ background: '#fff0e6', color: '#e85d04', fontFamily: "'Quicksand', sans-serif" }}
              >
                💫 Tại sao chọn BusGo?
              </span>
              <h2
                style={{ fontFamily: "'Quicksand', sans-serif", fontSize: 36, fontWeight: 700, color: '#4a3b32', margin: '12px 0 6px', lineHeight: 1.2 }}
              >
                Đơn giản · Nhanh chóng · Tin cậy
              </h2>
              <p style={{ color: '#9a7d6e', fontSize: 15, fontWeight: 600 }}>
                Chúng tôi luôn đồng hành cùng bạn trên mỗi chuyến đi 🌟
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {WHY_CARDS.map((card) => (
                <div
                  key={card.title}
                  className="rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  style={{ background: '#fff', boxShadow: '0 4px 24px rgba(74,59,50,0.08)' }}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4"
                    style={{ background: card.bg }}
                  >
                    {card.emoji}
                  </div>
                  <h4
                    style={{ fontFamily: "'Quicksand', sans-serif", fontSize: 16, fontWeight: 700, color: '#4a3b32', margin: '0 0 6px' }}
                  >
                    {card.title}
                  </h4>
                  <p className="text-sm leading-relaxed" style={{ color: '#9a7d6e', margin: 0 }}>
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 relative" style={{ background: '#fff0e6' }}>
        <WaveDivider fill="#fdfbf7" />

        <div className="max-w-7xl mx-auto mt-4">
          <div className="text-center mb-12">
            <span
              className="inline-block px-5 py-2 rounded-full text-sm font-bold mb-4"
              style={{ background: '#fff', color: '#e85d04', border: '1.5px solid #f5c7a0', fontFamily: "'Quicksand', sans-serif" }}
            >
              💬 Khách hàng nói gì?
            </span>
            <h2
              style={{ fontFamily: "'Quicksand', sans-serif", fontSize: 'clamp(30px, 3.5vw, 44px)', fontWeight: 700, color: '#4a3b32', margin: '0 0 10px' }}
            >
              Hàng triệu hành khách
              <br />
              tin tưởng BusGo 🥰
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1"
                style={{ background: '#fff', boxShadow: '0 8px 40px rgba(74,59,50,0.08)' }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <i key={i} className="ti ti-star-filled" style={{ color: '#e85d04', fontSize: 18 }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 40, lineHeight: 1, color: '#f5c7a0', fontFamily: 'Georgia, serif', marginTop: -8 }}>
                    "
                  </span>
                </div>
                <p className="text-base leading-relaxed mb-6" style={{ color: '#4a3b32' }}>
                  {t.quote}
                </p>
                <div className="flex items-center gap-3">
                  <img
                    src={t.avatar}
                    className="rounded-full"
                    style={{ width: 48, height: 48, border: '2px solid #fff0e6' }}
                    loading="lazy"
                    decoding="async"
                    alt={t.name}
                  />
                  <div>
                    <div className="font-bold text-sm" style={{ color: '#4a3b32' }}>{t.name}</div>
                    <div className="text-xs" style={{ color: '#9a7d6e' }}>{t.sub}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 relative" style={{ background: '#fdfbf7' }}>
        <WaveDivider fill="#fff0e6" />

        <div className="max-w-5xl mx-auto mt-4">
          <div
            className="rounded-3xl p-12 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #e85d04 0%, #f87426 50%, #ff9a5c 100%)',
              boxShadow: '0 24px 80px rgba(232,93,4,0.3)',
            }}
          >
            {/* Decorative circles */}
            <div
              className="absolute rounded-full pointer-events-none"
              style={{ top: -60, right: -60, width: 300, height: 300, background: 'rgba(255,255,255,0.08)' }}
            />
            <div
              className="absolute rounded-full pointer-events-none"
              style={{ bottom: -80, left: '20%', width: 250, height: 250, background: 'rgba(255,255,255,0.06)' }}
            />

            <div className="relative z-10 flex items-center justify-between flex-wrap gap-8">
              <div style={{ maxWidth: 480 }}>
                <div
                  className="inline-block px-4 py-1.5 rounded-full text-xs font-bold mb-4"
                  style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
                >
                  📱 Ứng dụng di động
                </div>
                <h2
                  style={{ fontFamily: "'Quicksand', sans-serif", fontSize: 38, fontWeight: 700, color: 'white', margin: '0 0 12px', lineHeight: 1.2 }}
                >
                  Đặt vé ngay trên
                  <br />
                  điện thoại của bạn!
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, margin: '0 0 28px', lineHeight: 1.6, fontWeight: 600 }}>
                  Tải ứng dụng BusGo để đặt vé, theo dõi xe và nhận thông báo chuyến đi mọi lúc mọi nơi 🚌
                </p>
                <div className="flex gap-3 flex-wrap">
                  <button
                    className="flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold transition-all hover:opacity-90"
                    style={{ background: 'white', color: '#e85d04', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}
                  >
                    <i className="ti ti-brand-apple" style={{ fontSize: 20 }} />
                    App Store
                  </button>
                  <button
                    className="flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold transition-all hover:bg-white/30"
                    style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1.5px solid rgba(255,255,255,0.3)', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}
                  >
                    <i className="ti ti-brand-google-play" style={{ fontSize: 20 }} />
                    Google Play
                  </button>
                </div>
              </div>

              <div className="text-right">
                <div style={{ fontSize: 80 }}>📱</div>
                <div className="flex gap-4 justify-end mt-4">
                  <div className="text-center">
                    <div style={{ fontFamily: "'Quicksand', sans-serif", fontSize: 24, fontWeight: 700, color: 'white' }}>4.9</div>
                    <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>App Store</div>
                  </div>
                  <div style={{ width: 1, background: 'rgba(255,255,255,0.3)' }} />
                  <div className="text-center">
                    <div style={{ fontFamily: "'Quicksand', sans-serif", fontSize: 24, fontWeight: 700, color: 'white' }}>4.8</div>
                    <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>Play Store</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Partners ─────────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 relative" style={{ background: '#fff0e6' }}>
        <WaveDivider fill="#fdfbf7" />

        <div className="max-w-7xl mx-auto mt-4">
          <div className="text-center mb-10">
            <span
              className="inline-block px-5 py-2 rounded-full text-sm font-bold mb-4"
              style={{ background: '#fff', color: '#e85d04', border: '1.5px solid #f5c7a0', fontFamily: "'Quicksand', sans-serif" }}
            >
              🤝 Đối tác của chúng tôi
            </span>
            <h2
              style={{ fontFamily: "'Quicksand', sans-serif", fontSize: 32, fontWeight: 700, color: '#4a3b32', margin: 0 }}
            >
              Hợp tác cùng 50+ hãng xe uy tín
            </h2>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {PARTNERS.map((p) => (
              <div
                key={p.name}
                className="flex items-center gap-2.5 px-7 py-3.5 rounded-full font-bold transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ background: '#fff', border: '2px solid #f0e6d8', color: '#4a3b32', boxShadow: '0 4px 16px rgba(74,59,50,0.09)' }}
              >
                <i className="ti ti-bus" style={{ color: p.color, fontSize: 18 }} />
                <span className="text-sm">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
