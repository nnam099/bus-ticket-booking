import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setSearchParams } from '../store/slices/tripSlice';
import { format } from 'date-fns';

const cityOptions = [
  'Hồ Chí Minh', 'Đà Lạt', 'Nha Trang', 'Cần Thơ', 'Hà Nội', 'Hải Phòng',
  'Đà Nẵng', 'Huế', 'Vũng Tàu', 'Phan Thiết', 'Buôn Ma Thuột', 'Quy Nhơn',
  'Quảng Ngãi', 'Lào Cai', 'Ninh Bình', 'Thanh Hóa', 'Vinh', 'Cà Mau',
];

const popularRoutes = [
  { origin: 'Hồ Chí Minh', destination: 'Đà Lạt', image: 'https://picsum.photos/id/11/600/400' },
  { origin: 'Hồ Chí Minh', destination: 'Nha Trang', image: 'https://picsum.photos/id/16/600/400' },
  { origin: 'Hà Nội', destination: 'Sapa', image: 'https://picsum.photos/id/28/600/400' },
  { origin: 'Đà Nẵng', destination: 'Hội An', image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=600&auto=format&fit=crop' },
  { origin: 'Hồ Chí Minh', destination: 'Vũng Tàu', image: 'https://picsum.photos/id/38/600/400' },
  { origin: 'Hồ Chí Minh', destination: 'Cần Thơ', image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?q=80&w=600&auto=format&fit=crop' },
];

const normalizeText = (value) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');

function CitySuggestInput({ label, icon, placeholder, value, onChange }) {
  const [focused, setFocused] = useState(false);
  const query = normalizeText(value.trim());
  const suggestions = cityOptions.filter((city) => !query || normalizeText(city).includes(query));

  return (
    <div className="relative group">
      <label className="label text-left text-white group-hover:text-brand transition-colors font-medium drop-shadow-md">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl">{icon}</span>
        <input
          className="input pl-10 bg-white/90 focus:bg-white text-gray-800"
          placeholder={placeholder}
          value={value}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          required
        />
        {focused && suggestions.length > 0 && (
          <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
            {suggestions.map((city) => (
              <button
                key={city}
                type="button"
                className="w-full px-4 py-3 text-left font-semibold text-gray-700 hover:bg-orange-50 hover:text-brand transition-colors"
                onMouseDown={() => onChange(city)}
              >
                {city}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const today = format(new Date(), 'yyyy-MM-dd');

  const [form, setForm] = useState({ origin: '', destination: '', date: today });

  const handleSearch = (e) => {
    e.preventDefault();
    if (!form.origin || !form.destination || !form.date) return;

    const validOrigin = cityOptions.find(
      (c) => normalizeText(c) === normalizeText(form.origin.trim()) || c.toLowerCase() === form.origin.trim().toLowerCase()
    );
    const validDest = cityOptions.find(
      (c) => normalizeText(c) === normalizeText(form.destination.trim()) || c.toLowerCase() === form.destination.trim().toLowerCase()
    );

    if (!validOrigin) {
      alert('Vui lòng chọn Điểm đi hợp lệ từ danh sách gợi ý.');
      return;
    }
    if (!validDest) {
      alert('Vui lòng chọn Điểm đến hợp lệ từ danh sách gợi ý.');
      return;
    }

    const searchForm = { ...form, origin: validOrigin, destination: validDest };
    dispatch(setSearchParams(searchForm));
    navigate(`/search?origin=${encodeURIComponent(validOrigin)}&destination=${encodeURIComponent(validDest)}&date=${form.date}`);
  };

  return (
    <div>
      {/* Hero */}
      <div 
        className="relative bg-gray-900 text-white py-32 px-4 overflow-hidden flex items-center justify-center min-h-[650px]"
        style={{
          backgroundImage: "url('/hero-bg.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Dark Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] z-0 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent z-0 pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10 w-full">
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight drop-shadow-2xl text-white">
            Khám phá hành trình mới
          </h1>
          <p className="text-gray-100 text-lg md:text-2xl mb-12 font-medium max-w-3xl mx-auto drop-shadow-md">
            Trải nghiệm dịch vụ xe khách cao cấp — Đặt vé siêu tốc, thanh toán an toàn.
          </p>

          {/* Search form with Glassmorphism */}
          <form onSubmit={handleSearch} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.2)] text-gray-800 transform transition-all duration-300 hover:bg-white/15">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <CitySuggestInput
                label="Điểm đi"
                icon="📍"
                placeholder="VD: Hồ Chí Minh"
                value={form.origin}
                onChange={(origin) => setForm({ ...form, origin })}
              />
              <CitySuggestInput
                label="Điểm đến"
                icon="🚩"
                placeholder="VD: Đà Lạt"
                value={form.destination}
                onChange={(destination) => setForm({ ...form, destination })}
              />
              <div className="relative group">
                <label className="label text-left text-white group-hover:text-brand transition-colors font-medium drop-shadow-md">Ngày đi</label>
                <input type="date" className="input bg-white/90 focus:bg-white text-gray-800" min={today}
                  value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
              </div>
            </div>
            <button type="submit" className="w-full mt-8 py-4 text-xl font-bold shadow-brand/40 shadow-xl rounded-2xl flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white transition-all transform hover:scale-[1.01]">
              <span>🔍</span> Tìm chuyến xe ngay
            </button>
          </form>
        </div>
      </div>

      {/* Popular Routes */}
      <div className="max-w-6xl mx-auto px-4 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black text-gray-800 mb-4">Tuyến xe phổ biến</h2>
          <p className="text-gray-500 font-medium text-lg">Khám phá những điểm đến tuyệt đẹp được yêu thích nhất</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {popularRoutes.map((r, i) => (
            <button key={i} onClick={() => {
              dispatch(setSearchParams({ origin: r.origin, destination: r.destination, date: today }));
              navigate(`/search?origin=${encodeURIComponent(r.origin)}&destination=${encodeURIComponent(r.destination)}&date=${today}`);
            }}
              className="relative group cursor-pointer overflow-hidden rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.1)] aspect-[4/3] w-full text-left transform transition-transform duration-300 hover:-translate-y-2">
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url(${r.image})` }}
              ></div>
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/30 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-300"></div>
              
              {/* Content */}
              <div className="absolute bottom-0 left-0 w-full p-6 flex flex-col justify-end z-10">
                <div className="text-white transform transition-transform duration-300 group-hover:-translate-y-2">
                  <h3 className="font-bold text-3xl mb-1 drop-shadow-md">{r.destination}</h3>
                  <div className="flex items-center gap-2 text-gray-300 text-sm font-medium">
                    <span>Từ {r.origin}</span>
                  </div>
                </div>
                {/* Hover CTA */}
                <div className="mt-4 overflow-hidden h-0 group-hover:h-12 transition-all duration-300 opacity-0 group-hover:opacity-100 flex items-center">
                  <span className="text-brand font-bold bg-white px-5 py-2.5 rounded-xl text-sm shadow-xl flex items-center gap-2"> 
                    Đặt vé ngay <span className="text-lg">→</span>
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="bg-gradient-to-b from-gray-50 to-white py-24 px-4 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-gray-800 mb-4">Tại sao chọn BusTicket?</h2>
            <p className="text-gray-500 font-medium text-lg">Trải nghiệm đặt vé cao cấp từ A đến Z</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { icon: '⚡', title: 'Đặt vé siêu tốc', desc: 'Giao diện trực quan, chọn ghế và thanh toán online chỉ trong vài thao tác.' },
              { icon: '🛡️', title: 'Thanh toán an toàn', desc: 'Bảo mật tuyệt đối, hỗ trợ đa dạng cổng thanh toán (VNPay, MoMo, Thẻ).' },
              { icon: '📱', title: 'Vé điện tử thông minh', desc: 'Nhận ngay mã vé QR qua Email. Lên xe nhanh chóng không cần vé giấy.' },
            ].map((f, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl text-center group border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgb(249,115,22,0.15)] transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center text-4xl mb-6 group-hover:bg-gradient-to-br group-hover:from-orange-500 group-hover:to-amber-500 group-hover:text-white group-hover:rotate-3 transition-all duration-500 shadow-inner">
                  {f.icon}
                </div>
                <h3 className="font-bold text-2xl text-gray-800 mb-4">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed text-base">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
