import CitySuggestInput from '../../../components/ui/CitySuggestInput';

export default function HeroSection({ form, setForm, selectedCity, setSelectedCity, handleSearch, handleQuickRoute, today }) {
  return (
    <section id="search-form" className="relative overflow-x-clip bg-sand pt-[88px] pb-24 px-6">
      {/* Blob decorations */}
      <div className="absolute rounded-full pointer-events-none -top-[180px] -left-[140px] w-[700px] h-[700px] bg-[radial-gradient(circle,rgba(255,204,153,0.55)_0%,transparent_65%)]" />
      <div className="absolute rounded-full pointer-events-none top-[60px] -right-[180px] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(255,224,204,0.6)_0%,transparent_65%)]" />
      <div className="absolute rounded-full pointer-events-none -bottom-[100px] left-[35%] w-[450px] h-[450px] bg-[radial-gradient(circle,rgba(255,214,179,0.55)_0%,transparent_65%)]" />

      <div className="relative z-10 text-center max-w-5xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold mb-6 bg-peach text-brand border-[1.5px] border-mocha-accent font-quicksand">
          🇻🇳 Khám phá Việt Nam cùng BusGo
        </div>

        {/* Heading */}
        <h1 className="mb-4 font-quicksand text-[clamp(44px,5vw,68px)] font-bold text-mocha leading-[1.1]">
          Đặt vé xe khách
          <br />
          <span className="text-brand">nhanh &amp; dễ dàng 🚌</span>
        </h1>
        <p className="mb-12 text-mocha-light text-[19px] font-semibold">
          Hơn 200+ tuyến đường · Giá tốt nhất · Đặt ngay hôm nay 🎉
        </p>

        {/* Search widget */}
        <form
          onSubmit={handleSearch}
          className="mx-auto rounded-3xl bg-white p-4 shadow-[0_24px_80px_rgba(232,93,4,0.13),0_4px_24px_rgba(74,59,50,0.07)] max-w-[960px]"
        >
          <div className="text-left px-4 pb-3 font-bold font-quicksand text-xl text-mocha">
            Đi đâu hôm nay? 🌟
          </div>
          <div className="flex items-center rounded-2xl flex-wrap md:flex-nowrap bg-sand">
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
                className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer transition-colors hover:bg-peach bg-peach"
                onClick={() => {
                  setForm({ ...form, origin: form.destination, destination: form.origin });
                  setSelectedCity({ origin: selectedCity.destination, destination: selectedCity.origin });
                }}
              >
                <i className="ti ti-arrows-right-left text-brand text-[15px]" />
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
            <div className="relative flex-1 px-5 py-4 border-r-[1.5px] border-mocha-border">
              <div className="text-xs font-bold uppercase mb-1.5 text-brand tracking-[0.8px]">
                Ngày đi
              </div>
              <div className="flex items-center gap-2">
                <i className="ti ti-calendar text-mocha-card text-[18px]" />
                <input
                  type="date"
                  className="bg-transparent border-none outline-none text-base font-semibold w-full text-mocha [color-scheme:light]"
                  min={today}
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Passenger */}
            <div className="relative flex-1 px-5 py-4">
              <div className="text-xs font-bold uppercase mb-1.5 text-brand tracking-[0.8px]">
                Hành khách
              </div>
              <div className="flex items-center gap-2">
                <i className="ti ti-users text-mocha-card text-[18px]" />
                <span className="text-base font-semibold text-mocha">
                  1 người
                </span>
              </div>
            </div>

            {/* Search button */}
            <div className="px-3 py-3 shrink-0">
              <button
                type="submit"
                className="w-14 h-14 flex items-center justify-center rounded-full border-0 transition-all hover:opacity-90 hover:scale-105 bg-brand shadow-[0_8px_28px_rgba(232,93,4,0.45)] cursor-pointer"
              >
                <i className="ti ti-search text-white text-[22px]" />
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
              className="flex items-center gap-2 text-sm font-bold cursor-pointer rounded-full px-5 py-2.5 transition-all hover:bg-peach bg-white border-[1.5px] border-mocha-border text-mocha shadow-[0_2px_12px_rgba(74,59,50,0.07)]"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Mini stats */}
        <div className="flex items-center justify-center gap-8 mt-10 flex-wrap">
          {[
            { icon: 'ti-bus', label: 'Tuyến đường', value: '200+', bg: 'bg-peach', color: 'text-brand' },
            { icon: 'ti-users', label: 'Hành khách', value: '2M+', bg: 'bg-green-50', color: 'text-forest' },
            { icon: 'ti-star-filled', label: 'Đánh giá', value: '4.9★', bg: 'bg-peach', color: 'text-brand' },
            { icon: 'ti-shield-check', label: 'Bảo mật', value: '100%', bg: 'bg-green-50', color: 'text-forest' },
          ].map(({ icon, label, value, bg, color }, idx, arr) => (
            <div key={label} className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${bg}`}>
                <i className={`ti ${icon} ${color} text-[18px]`} />
              </div>
              <div className="text-left">
                <div className="text-lg font-bold text-mocha font-quicksand">
                  {value}
                </div>
                <div className="text-xs text-mocha-light">
                  {label}
                </div>
              </div>
              {idx < arr.length - 1 && (
                <div className="w-px h-10 ml-5 bg-mocha-border" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
