import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setSearchParams } from '../store/slices/tripSlice';
import { format } from 'date-fns';

export default function HomePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const today = format(new Date(), 'yyyy-MM-dd');

  const [form, setForm] = useState({ origin: '', destination: '', date: today });

  const handleSearch = (e) => {
    e.preventDefault();
    if (!form.origin || !form.destination || !form.date) return;
    dispatch(setSearchParams(form));
    navigate(`/search?origin=${form.origin}&destination=${form.destination}&date=${form.date}`);
  };

  const popularRoutes = [
    { origin: 'Hồ Chí Minh', destination: 'Đà Lạt' },
    { origin: 'Hồ Chí Minh', destination: 'Nha Trang' },
    { origin: 'Hà Nội', destination: 'Sapa' },
    { origin: 'Hà Nội', destination: 'Hạ Long' },
    { origin: 'Đà Nẵng', destination: 'Hội An' },
    { origin: 'Hồ Chí Minh', destination: 'Vũng Tàu' },
  ];

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-700 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Đặt vé xe khách dễ dàng</h1>
          <p className="text-orange-100 text-lg mb-10">Hàng trăm tuyến xe — Đặt nhanh, thanh toán tiện lợi</p>

          {/* Search form */}
          <form onSubmit={handleSearch} className="bg-white rounded-2xl p-4 shadow-xl text-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="label text-left">Điểm đi</label>
                <input className="input" placeholder="VD: Hồ Chí Minh"
                  value={form.origin} onChange={e => setForm({ ...form, origin: e.target.value })} required />
              </div>
              <div>
                <label className="label text-left">Điểm đến</label>
                <input className="input" placeholder="VD: Đà Lạt"
                  value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} required />
              </div>
              <div>
                <label className="label text-left">Ngày đi</label>
                <input type="date" className="input" min={today}
                  value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
              </div>
            </div>
            <button type="submit" className="btn-primary w-full mt-4 py-3 text-base">
              🔍 Tìm chuyến xe
            </button>
          </form>
        </div>
      </div>

      {/* Popular Routes */}
      <div className="max-w-4xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Tuyến xe phổ biến</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {popularRoutes.map((r, i) => (
            <button key={i} onClick={() => {
              dispatch(setSearchParams({ origin: r.origin, destination: r.destination, date: today }));
              navigate(`/search?origin=${r.origin}&destination=${r.destination}&date=${today}`);
            }}
              className="card hover:border-brand hover:shadow-md transition-all text-left group">
              <div className="flex items-center gap-2 text-brand font-semibold group-hover:text-orange-600">
                <span>📍</span>
                <span>{r.origin}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-gray-500 text-sm">
                <span className="ml-1">↓</span>
                <span>{r.destination}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="bg-orange-50 py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">Tại sao chọn BusTicket?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '⚡', title: 'Đặt vé nhanh chóng', desc: 'Chọn ghế, thanh toán online trong vài phút' },
              { icon: '🔒', title: 'Thanh toán an toàn', desc: 'Hỗ trợ VNPay, MoMo, thẻ ngân hàng' },
              { icon: '📱', title: 'Vé điện tử QR', desc: 'Nhận vé ngay sau thanh toán, không cần in' },
            ].map((f, i) => (
              <div key={i} className="card text-center">
                <div className="text-4xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-800 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
