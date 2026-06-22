import WaveDivider from '../../../components/ui/WaveDivider';
import { PARTNERS } from '../constants';

export default function PartnersSection() {
  return (
    <section className="py-16 px-6 relative bg-peach">
      <WaveDivider fillClassName="fill-sand" />

      <div className="max-w-7xl mx-auto mt-4">
        <div className="text-center mb-10">
          <span className="inline-block px-5 py-2 rounded-full text-sm font-bold mb-4 bg-white text-brand border-[1.5px] border-mocha-accent font-quicksand">
            🤝 Đối tác của chúng tôi
          </span>
          <h2 className="font-quicksand text-[32px] font-bold text-mocha m-0">
            Hợp tác cùng 50+ hãng xe uy tín
          </h2>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          {PARTNERS.map((p) => (
            <div
              key={p.name}
              className="flex items-center gap-2.5 px-7 py-3.5 rounded-full font-bold transition-all hover:-translate-y-0.5 hover:shadow-md bg-white border-2 border-mocha-border text-mocha shadow-[0_4px_16px_rgba(74,59,50,0.09)]"
            >
              <i className={`ti ti-bus ${p.color} text-[18px]`} />
              <span className="text-sm">{p.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
