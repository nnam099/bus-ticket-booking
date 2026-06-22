import WaveDivider from '../../../components/ui/WaveDivider';
import { ACTIVITY_FEED, WHY_CARDS } from '../constants';

export default function ActivityFeedSection() {
  return (
    <section className="py-20 px-6 relative bg-sand">
      <WaveDivider fillClassName="fill-peach" />

      <div className="max-w-7xl mx-auto mt-4 grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Activity Feed */}
        <div className="rounded-3xl p-8 bg-white shadow-[0_8px_40px_rgba(74,59,50,0.08)]">
          <div className="flex items-center gap-4 mb-7">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-peach">
              📡
            </div>
            <div>
              <h3 className="font-quicksand text-[22px] font-bold text-mocha m-0">
                Hoạt động gần đây
              </h3>
              <p className="text-sm font-semibold text-mocha-light m-0">
                Đang cập nhật · <span className="text-forest">● Trực tiếp</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {ACTIVITY_FEED.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-3 p-3 rounded-2xl transition-colors hover:bg-peach bg-sand"
              >
                <img
                  src={item.avatar}
                  className="rounded-full shrink-0 w-10 h-10 border-2 border-peach"
                  loading="lazy"
                  decoding="async"
                  alt={item.name}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold mb-0.5 text-mocha m-0">
                    📍 {item.name} <span className="font-medium">vừa đặt {item.seats} ghế</span>
                  </p>
                  <p className="text-xs font-bold text-brand m-0">
                    {item.route}
                  </p>
                </div>
                <span className="text-xs shrink-0 text-mocha-card">
                  {item.time}
                </span>
              </div>
            ))}
          </div>

          {/* Live indicator */}
          <div className="mt-6 p-4 rounded-2xl flex items-center gap-3 bg-[linear-gradient(135deg,#fff0e6,#fff8f2)] border-[1.5px] border-mocha-accent">
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-forest inline-block animate-pulse" />
              <span className="text-xs font-bold text-forest">LIVE</span>
            </div>
            <div className="w-px h-5 bg-mocha-border" />
            <p className="text-sm font-semibold text-mocha m-0">
              Hiện có <strong className="text-brand">1,284 khách hàng</strong> đang tìm chuyến đi
            </p>
          </div>
        </div>

        {/* Why BusGo */}
        <div>
          <div className="mb-7">
            <span className="inline-block px-5 py-2 rounded-full text-sm font-bold mb-4 bg-peach text-brand font-quicksand">
              💫 Tại sao chọn BusGo?
            </span>
            <h2 className="font-quicksand text-[36px] font-bold text-mocha mt-3 mb-1.5 leading-[1.2]">
              Đơn giản · Nhanh chóng · Tin cậy
            </h2>
            <p className="text-mocha-light text-[15px] font-semibold">
              Chúng tôi luôn đồng hành cùng bạn trên mỗi chuyến đi 🌟
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {WHY_CARDS.map((card) => (
              <div
                key={card.title}
                className="rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-white shadow-[0_4px_24px_rgba(74,59,50,0.08)]"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4 ${card.bg}`}>
                  {card.emoji}
                </div>
                <h4 className="font-quicksand text-[16px] font-bold text-mocha m-0 mb-1.5">
                  {card.title}
                </h4>
                <p className="text-sm leading-relaxed text-mocha-light m-0">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
