import WaveDivider from '../../../components/ui/WaveDivider';
import { WHY_CARDS } from '../constants';

export default function ActivityFeedSection() {
  return (
    <section className="py-20 px-6 relative bg-sand">
      <WaveDivider fillClassName="fill-peach" />

      <div className="max-w-6xl mx-auto mt-4">
        {/* Why BusGo */}
        <div className="text-center mb-12">
          <span className="inline-block px-5 py-2 rounded-full text-sm font-bold mb-4 bg-peach text-brand font-quicksand">
            Tại sao chọn BusGo?
          </span>
          <h2 className="font-quicksand text-[clamp(30px,3.5vw,40px)] font-bold text-mocha mt-3 mb-2.5 leading-[1.2]">
            Đơn giản · Nhanh chóng · Tin cậy
          </h2>
          <p className="text-mocha-light text-[16px] font-semibold">
            Chúng tôi luôn đồng hành cùng bạn trên mỗi chuyến đi
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {WHY_CARDS.map((card) => (
            <div
              key={card.title}
              className="rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-white shadow-[0_4px_24px_rgba(74,59,50,0.08)] flex flex-col items-center text-center"
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-5 ${card.bg}`}>
                {card.emoji}
              </div>
              <h4 className="font-quicksand text-[18px] font-bold text-mocha m-0 mb-2">
                {card.title}
              </h4>
              <p className="text-[15px] leading-relaxed text-mocha-light m-0">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
