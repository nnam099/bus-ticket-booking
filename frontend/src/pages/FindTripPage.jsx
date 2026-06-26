import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setSearchParams } from '../store/slices/tripSlice';
import { format } from 'date-fns';
import { findCity, normalizeText } from '../constants/travel';
import CitySuggestInput from '../components/ui/CitySuggestInput';

export default function FindTripPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const today = format(new Date(), 'yyyy-MM-dd');

  const [form, setForm] = useState({ origin: '', destination: '', date: today });
  const [selectedCity, setSelectedCity] = useState({ origin: '', destination: '' });
  const [error, setError] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    setError('');

    if (!form.origin || !form.destination || !form.date) return;

    const validOrigin = findCity(form.origin);
    const validDest = findCity(form.destination);

    if (!validOrigin) {
      setError('Vui lòng nhập Điểm đi hợp lệ (ví dụ: Hà Nội, Hồ Chí Minh).');
      return;
    }
    if (!validDest) {
      setError('Vui lòng nhập Điểm đến hợp lệ (ví dụ: Đà Lạt, Nha Trang).');
      return;
    }
    if (normalizeText(validOrigin) === normalizeText(validDest)) {
      setError('Điểm đi và điểm đến phải là hai thành phố khác nhau.');
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
    <div className="min-h-[calc(100vh-80px)] bg-sand dark:bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
      {/* Background Blobs */}
      <div className="absolute rounded-full pointer-events-none -top-[100px] -left-[100px] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(255,204,153,0.4)_0%,transparent_65%)] dark:bg-[radial-gradient(circle,rgba(232,93,4,0.1)_0%,transparent_65%)]" />
      <div className="absolute rounded-full pointer-events-none bottom-[50px] -right-[100px] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(255,224,204,0.4)_0%,transparent_65%)] dark:bg-[radial-gradient(circle,rgba(232,93,4,0.1)_0%,transparent_65%)]" />

      {/* Toast Notification Error */}
      {error && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-red-50 text-red-600 px-6 py-3 rounded-full font-bold shadow-lg border border-red-200 flex items-center gap-2 animate-bounce">
          <i className="ti ti-alert-circle text-xl" />
          {error}
          <button onClick={() => setError('')} className="ml-2 hover:opacity-70">
            <i className="ti ti-x" />
          </button>
        </div>
      )}

      <div className="relative z-10 w-full max-w-4xl -mt-20">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-mocha dark:text-gray-100 font-quicksand mb-4">
            Bạn muốn đi đâu?
          </h1>
          <p className="text-mocha-light dark:text-gray-400 font-medium">
            Tìm chuyến xe nhanh chóng và dễ dàng cùng BusGo
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="mx-auto rounded-3xl bg-white dark:bg-slate-800 p-4 shadow-[0_24px_80px_rgba(232,93,4,0.13),0_4px_24px_rgba(74,59,50,0.07)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] border border-white/50 dark:border-slate-700"
        >
          <div className="flex flex-col md:flex-row items-stretch rounded-2xl bg-sand dark:bg-slate-900 border border-mocha-border dark:border-slate-700 overflow-hidden">
            {/* Origin */}
            <div className="flex-1">
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
            </div>

            {/* Swap icon */}
            <div className="flex items-center justify-center px-4 py-3 md:py-0 bg-sand dark:bg-slate-900 z-10 -my-3 md:-mx-3">
              <div
                className="w-10 h-10 flex items-center justify-center rounded-full cursor-pointer transition-colors hover:bg-peach dark:hover:bg-slate-800 bg-white dark:bg-slate-800 border border-mocha-border dark:border-slate-600 shadow-sm"
                onClick={() => {
                  setForm({ ...form, origin: form.destination, destination: form.origin });
                  setSelectedCity({ origin: selectedCity.destination, destination: selectedCity.origin });
                }}
              >
                <i className="ti ti-arrows-right-left text-brand text-lg md:rotate-0 rotate-90" />
              </div>
            </div>

            {/* Destination */}
            <div className="flex-1">
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
            </div>

            {/* Date */}
            <div className="relative flex-1 px-5 py-4 border-t md:border-t-0 md:border-l-[1.5px] border-mocha-border dark:border-slate-700">
              <div className="text-xs font-bold uppercase mb-1.5 text-brand tracking-[0.8px]">
                Ngày đi
              </div>
              <div className="flex items-center gap-2">
                <i className="ti ti-calendar text-mocha-card text-[18px]" />
                <input
                  type="date"
                  className="bg-transparent border-none outline-none text-base font-semibold w-full text-mocha dark:text-gray-200 [color-scheme:light] dark:[color-scheme:dark]"
                  min={today}
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Search button */}
            <div className="p-3 bg-white dark:bg-slate-800 flex items-center justify-center border-t md:border-t-0 border-mocha-border dark:border-slate-700 md:border-none">
              <button
                type="submit"
                className="w-full md:w-16 h-12 md:h-16 flex items-center justify-center rounded-xl md:rounded-full border-0 transition-all hover:opacity-90 hover:scale-105 bg-brand shadow-[0_8px_28px_rgba(232,93,4,0.45)] cursor-pointer text-white font-bold gap-2"
              >
                <i className="ti ti-search text-white text-[22px]" />
                <span className="md:hidden">Tìm chuyến</span>
              </button>
            </div>
          </div>
        </form>

        {/* Quick route chips */}
        <div className="flex flex-wrap gap-3 justify-center mt-8">
          {[
            { label: 'Hà Nội → Đà Nẵng 🌊', origin: 'Hà Nội', dest: 'Đà Nẵng' },
            { label: 'TP.HCM → Đà Lạt 🌿', origin: 'Hồ Chí Minh', dest: 'Đà Lạt' },
            { label: 'Huế → Hội An 🏮', origin: 'Huế', dest: 'Hoi An' },
          ].map(({ label, origin, dest }) => (
            <button
              key={label}
              type="button"
              onClick={() => handleQuickRoute(origin, dest)}
              className="flex items-center gap-2 text-sm font-bold cursor-pointer rounded-full px-5 py-2.5 transition-all hover:bg-peach dark:hover:bg-slate-800 bg-white dark:bg-slate-800 border-[1.5px] border-mocha-border dark:border-slate-700 text-mocha dark:text-gray-300 shadow-sm hover:shadow-md"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
