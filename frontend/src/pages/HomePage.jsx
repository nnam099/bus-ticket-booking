import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setSearchParams } from '../store/slices/tripSlice';
import { format } from 'date-fns';

const cityOptions = [
  'Hồ Chí Minh',
  'Đà Lạt',
  'Nha Trang',
  'Cần Thơ',
  'Hà Nội',
  'Hải Phòng',
  'Đà Nẵng',
  'Huế',
];

const popularRoutes = [
  { origin: 'Hồ Chí Minh', destination: 'Đà Lạt' },
  { origin: 'Đà Lạt', destination: 'Hồ Chí Minh' },
  { origin: 'Hồ Chí Minh', destination: 'Nha Trang' },
  { origin: 'Nha Trang', destination: 'Hồ Chí Minh' },
  { origin: 'Hồ Chí Minh', destination: 'Cần Thơ' },
  { origin: 'Cần Thơ', destination: 'Hồ Chí Minh' },
  { origin: 'Hà Nội', destination: 'Hải Phòng' },
  { origin: 'Hải Phòng', destination: 'Hà Nội' },
  { origin: 'Đà Nẵng', destination: 'Huế' },
  { origin: 'Huế', destination: 'Đà Nẵng' },
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
      <label className="label text-left text-gray-600 group-hover:text-brand transition-colors">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl">{icon}</span>
        <input
          className="input pl-10 bg-gray-50/50"
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
    dispatch(setSearchParams(form));
    navigate(`/search?origin=${encodeURIComponent(form.origin)}&destination=${encodeURIComponent(form.destination)}&date=${form.date}`);
  };

  return (
    <div>
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 text-white py-28 px-4 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute top-32 -left-24 w-72 h-72 bg-amber-300/20 rounded-full blur-2xl"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight drop-shadow-md">
            Khám phá hành trình mới
          </h1>
          <p className="text-orange-50 text-lg md:text-xl mb-12 font-medium max-w-2xl mx-auto opacity-90">
            Hàng trăm tuyến xe chất lượng cao — Đặt vé siêu tốc, thanh toán an toàn, tận hưởng chuyến đi tuyệt vời.
          </p>

          {/* Search form */}
          <form onSubmit={handleSearch} className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl text-gray-800 transform hover:scale-[1.01] transition-transform duration-300 border border-white/50">
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
                <label className="label text-left text-gray-600 group-hover:text-brand transition-colors">Ngày đi</label>
                <input type="date" className="input bg-gray-50/50" min={today}
                  value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
              </div>
            </div>
            <button type="submit" className="btn-primary w-full mt-6 py-4 text-lg font-bold shadow-brand/40 shadow-xl rounded-2xl flex items-center justify-center gap-2">
              <span>🔍</span> Tìm chuyến xe ngay
            </button>
          </form>
        </div>
      </div>

      {/* Popular Routes */}
      <div className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-gray-800 mb-3">Tuyến xe phổ biến</h2>
          <p className="text-gray-500 font-medium">Khám phá những điểm đến được yêu thích nhất</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {popularRoutes.map((r, i) => (
            <button key={i} onClick={() => {
              dispatch(setSearchParams({ origin: r.origin, destination: r.destination, date: today }));
              navigate(`/search?origin=${encodeURIComponent(r.origin)}&destination=${encodeURIComponent(r.destination)}&date=${today}`);
            }}
              className="card group cursor-pointer border-transparent bg-white shadow-sm hover:border-brand/30 hover:bg-orange-50/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300">
                  🗺️
                </div>
                <div className="text-left flex-1">
                  <div className="font-bold text-gray-800 group-hover:text-brand transition-colors text-lg">
                    {r.origin}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-gray-500 text-sm font-medium">
                    <span className="text-brand">→</span>
                    <span>{r.destination}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="bg-gradient-to-b from-gray-50 to-white py-20 px-4 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-gray-800 mb-3">Tại sao chọn BusTicket?</h2>
            <p className="text-gray-500 font-medium">Trải nghiệm đặt vé hoàn hảo từ A đến Z</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '⚡', title: 'Đặt vé siêu tốc', desc: 'Giao diện trực quan, chọn ghế và thanh toán online chỉ trong vài thao tác.' },
              { icon: '🛡️', title: 'Thanh toán an toàn', desc: 'Bảo mật tuyệt đối, hỗ trợ đa dạng cổng thanh toán (VNPay, MoMo, Thẻ).' },
              { icon: '📱', title: 'Vé điện tử thông minh', desc: 'Nhận ngay mã vé QR qua Email. Lên xe nhanh chóng không cần vé giấy.' },
            ].map((f, i) => (
              <div key={i} className="card text-center group bg-white border-transparent hover:border-brand/20">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-orange-50 flex items-center justify-center text-4xl mb-6 group-hover:bg-brand group-hover:text-white group-hover:-rotate-6 transition-all duration-300 shadow-inner">
                  {f.icon}
                </div>
                <h3 className="font-bold text-xl text-gray-800 mb-3">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
