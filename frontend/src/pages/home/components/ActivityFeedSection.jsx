import WaveDivider from '../../../components/ui/WaveDivider';
import { WHY_CARDS } from '../constants';
import { Bus, CreditCard, Ticket } from 'lucide-react';

const icons = {
  bus: <Bus className="w-10 h-10 text-orange-500" />,
  card: <CreditCard className="w-10 h-10 text-green-600" />,
  ticket: <Ticket className="w-10 h-10 text-green-600" />
};

export default function ActivityFeedSection() {
  return (
    <section className="py-24 px-6 relative bg-sand dark:bg-slate-900 overflow-hidden">
      <WaveDivider fillClassName="fill-peach dark:fill-slate-800" />

      <div className="max-w-6xl mx-auto mt-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-5 py-2 rounded-full text-sm font-bold mb-5 bg-orange-100/80 text-brand font-quicksand border border-orange-200/50 shadow-sm">
            Tại sao chọn BusGo?
          </span>
          <h2 className="font-quicksand text-[clamp(32px,4vw,44px)] font-extrabold text-mocha dark:text-white mt-2 mb-4 leading-[1.2] tracking-tight">
            Đơn giản · Nhanh chóng · Tin cậy
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium max-w-2xl mx-auto">
            Chúng tôi luôn đồng hành cùng bạn trên mỗi chuyến đi, mang đến trải nghiệm đặt vé tuyệt vời nhất
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {WHY_CARDS.map((card) => (
            <div
              key={card.title}
              className="group relative rounded-[2rem] p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(232,93,4,0.15)] bg-white dark:bg-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-slate-700 flex flex-col items-center text-center overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ${card.bg} dark:bg-slate-700 border border-white/50 dark:border-slate-600`}>
                {icons[card.iconType]}
              </div>
              <h4 className="font-quicksand text-xl font-bold text-gray-900 dark:text-white m-0 mb-3">
                {card.title}
              </h4>
              <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400 m-0">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Decorative background blur */}
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-80 h-80 bg-orange-300/5 rounded-full blur-3xl pointer-events-none" />
    </section>
  );
}
