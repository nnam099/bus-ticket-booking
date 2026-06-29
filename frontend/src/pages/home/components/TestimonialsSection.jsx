import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import WaveDivider from '../../../components/ui/WaveDivider';
import { reviewAPI } from '../../../services/api';

export default function TestimonialsSection() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await reviewAPI.getLatest(3);
        if (response.data?.success) {
          setReviews(response.data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch latest reviews', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

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

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-3xl p-7 bg-white shadow-[0_8px_40px_rgba(74,59,50,0.08)] animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
                <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 rounded w-5/6 mb-6" />
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200" />
                  <div className="flex-1">
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((t) => (
              <div
                key={t.id}
                className="rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1 bg-white shadow-[0_8px_40px_rgba(74,59,50,0.08)]"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <i key={i} className={`ti ti-star-filled text-[18px] ${i < t.rating ? 'text-brand' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <span className="text-[40px] leading-none text-mocha-accent font-serif -mt-2">
                    "
                  </span>
                </div>
                <p className="text-base leading-relaxed mb-6 text-mocha italic">
                  "{t.comment || 'Tuyệt vời, tôi rất hài lòng với chuyến đi này!'}"
                </p>
                <div className="flex items-center gap-3">
                  <img
                    src={t.customer?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.customer?.fullName || 'User')}&background=fff0e6&color=e85d04`}
                    className="rounded-full w-12 h-12 border-2 border-peach object-cover"
                    loading="lazy"
                    decoding="async"
                    alt={t.customer?.fullName}
                  />
                  <div>
                    <div className="font-bold text-sm text-mocha">{t.customer?.fullName || 'Khách hàng'}</div>
                    <div className="text-xs text-mocha-light">{t.customer?.address || 'Khách hàng BusGo'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <Star className="w-12 h-12 text-yellow-400 mb-4 fill-current" />
            <h3 className="font-quicksand font-bold text-mocha text-xl mb-2">Chưa có đánh giá nào</h3>
            <p className="text-mocha-light">Hãy là những người đầu tiên trải nghiệm và chia sẻ cùng BusGo nhé!</p>
          </div>
        )}
      </div>
    </section>
  );
}
