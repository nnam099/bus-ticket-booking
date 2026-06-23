import WaveDivider from '../../../components/ui/WaveDivider';
import { DESTINATIONS } from '../constants';

export default function DestinationsGallery({ handleQuickRoute }) {
  return (
    <section className="py-20 px-6 relative bg-peach">
      <WaveDivider fillClassName="fill-sand" />

      <div className="max-w-7xl mx-auto mt-4">
        <div className="text-center mb-12">
          <span className="inline-block px-5 py-2 rounded-full text-sm font-bold mb-4 bg-white text-brand border-[1.5px] border-mocha-accent font-quicksand">
            Điểm đến nổi bật
          </span>
          <h2 className="font-quicksand text-[clamp(32px,4vw,46px)] font-bold text-mocha m-0 mb-[10px]">
            Khám phá Việt Nam
          </h2>
          <p className="text-mocha-light text-base font-semibold">
            Mỗi chuyến đi là một trải nghiệm đáng nhớ
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {DESTINATIONS.map((dest) => (
            <div
              key={dest.name}
              className="rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl bg-white shadow-[0_8px_40px_rgba(74,59,50,0.1)]"
            >
              <div className="relative h-[240px] overflow-hidden group">
                <img
                  src={dest.img}
                  alt={dest.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(74,59,50,0.4)_0%,transparent_60%)]" />
                <div className="absolute top-3 right-3 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white text-brand">
                  ⭐ {dest.rating}
                </div>
                <div className="absolute bottom-3 left-4">
                  <span
                    className="text-xs px-2 py-1 rounded-full font-bold bg-white/90"
                    style={{ color: dest.regionColor }}
                  >
                    {dest.region}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-quicksand font-bold text-mocha text-[19px] m-0 mb-[5px]">
                  {dest.name}
                </h3>
                <p className="text-mocha-light text-[13px] m-0 mb-[14px] leading-[1.5]">
                  {dest.desc}
                </p>
                <button
                  className="w-full py-2.5 rounded-full text-sm font-bold transition-all hover:bg-brand hover:text-white bg-peach text-brand border-none cursor-pointer"
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
  );
}
