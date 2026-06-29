import WaveDivider from '../../../components/ui/WaveDivider';
import { Smartphone } from 'lucide-react';

export default function CTABannerSection() {
  return (
    <section className="py-20 px-6 relative bg-sand">
      <WaveDivider fillClassName="fill-peach" />

      <div className="max-w-5xl mx-auto mt-4">
        <div className="rounded-3xl p-12 relative overflow-hidden bg-[linear-gradient(135deg,#e85d04_0%,#f87426_50%,#ff9a5c_100%)] shadow-[0_24px_80px_rgba(232,93,4,0.3)]">
          {/* Decorative circles */}
          <div className="absolute rounded-full pointer-events-none -top-[60px] -right-[60px] w-[300px] h-[300px] bg-white/10" />
          <div className="absolute rounded-full pointer-events-none -bottom-[80px] left-[20%] w-[250px] h-[250px] bg-white/5" />

          <div className="relative z-10 flex items-center justify-between flex-wrap gap-8">
            <div className="max-w-[480px]">
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold mb-4 bg-white/20 text-white">
                <Smartphone className="w-4 h-4" /> Ứng dụng di động
              </div>
              <h2 className="font-quicksand text-[38px] font-bold text-white m-0 mb-3 leading-[1.2]">
                Đặt vé ngay trên
                <br />
                điện thoại của bạn!
              </h2>
              <p className="text-white/85 text-[16px] m-0 mb-7 leading-[1.6] font-semibold">
                Tải ứng dụng BusGo để đặt vé, theo dõi xe và nhận thông báo chuyến đi mọi lúc mọi nơi
              </p>
              <div className="flex gap-3 flex-wrap">
                <button className="flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold transition-all hover:opacity-90 bg-white text-brand border-none cursor-pointer text-[14px]">
                  <i className="ti ti-brand-apple text-[20px]" />
                  App Store
                </button>
                <button className="flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold transition-all hover:bg-white/30 bg-white/15 text-white border-[1.5px] border-white/30 cursor-pointer text-[14px]">
                  <i className="ti ti-brand-google-play text-[20px]" />
                  Google Play
                </button>
              </div>
            </div>

            <div className="text-right">
              <div className="flex justify-end">
                <Smartphone className="w-24 h-24 text-white" strokeWidth={1.5} />
              </div>
              <div className="flex gap-4 justify-end mt-4">
                <div className="text-center">
                  <div className="font-quicksand text-[24px] font-bold text-white">4.9</div>
                  <div className="text-white/75 text-[12px]">App Store</div>
                </div>
                <div className="w-px bg-white/30" />
                <div className="text-center">
                  <div className="font-quicksand text-[24px] font-bold text-white">4.8</div>
                  <div className="text-white/75 text-[12px]">Play Store</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
