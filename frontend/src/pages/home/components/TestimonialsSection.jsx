import WaveDivider from '../../../components/ui/WaveDivider';
import { TESTIMONIALS } from '../constants';

export default function TestimonialsSection() {
  return (
    <section className="py-20 px-6 relative bg-peach">
      <WaveDivider fillClassName="fill-sand" />

      <div className="max-w-7xl mx-auto mt-4">
        <div className="text-center mb-12">
          <span className="inline-block px-5 py-2 rounded-full text-sm font-bold mb-4 bg-white text-brand border-[1.5px] border-mocha-accent font-quicksand">
            💬 Khách hàng nói gì?
          </span>
          <h2 className="font-quicksand text-[clamp(30px,3.5vw,44px)] font-bold text-mocha m-0 mb-2.5">
            Hàng triệu hành khách
            <br />
            tin tưởng BusGo 🥰
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1 bg-white shadow-[0_8px_40px_rgba(74,59,50,0.08)]"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <i key={i} className="ti ti-star-filled text-brand text-[18px]" />
                  ))}
                </div>
                <span className="text-[40px] leading-none text-mocha-accent font-serif -mt-2">
                  "
                </span>
              </div>
              <p className="text-base leading-relaxed mb-6 text-mocha">
                {t.quote}
              </p>
              <div className="flex items-center gap-3">
                <img
                  src={t.avatar}
                  className="rounded-full w-12 h-12 border-2 border-peach"
                  loading="lazy"
                  decoding="async"
                  alt={t.name}
                />
                <div>
                  <div className="font-bold text-sm text-mocha">{t.name}</div>
                  <div className="text-xs text-mocha-light">{t.sub}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
