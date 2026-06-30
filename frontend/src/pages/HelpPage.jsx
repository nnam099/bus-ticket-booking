import { Bus, HelpCircle, Phone, LifeBuoy, Zap, ShieldCheck, CreditCard, Ticket } from 'lucide-react';

export default function HelpPage() {
  const faqs = [
    {
      q: 'Làm thế nào để đặt vé xe?',
      a: 'Nhập điểm đi, điểm đến và ngày khởi hành trên trang chủ → Chọn chuyến phù hợp → Chọn ghế → Nhập thông tin hành khách → Thanh toán → Nhận vé điện tử.',
    },
    {
      q: 'Tôi có thể đặt tối đa bao nhiêu ghế một lần?',
      a: 'Mỗi lần đặt bạn có thể chọn tối đa 5 ghế trên cùng một chuyến.',
    },
    {
      q: 'Ghế được giữ trong bao lâu sau khi chọn?',
      a: 'Sau khi chọn ghế, bạn có 15 phút để hoàn tất thanh toán. Nếu hết thời gian, ghế sẽ được tự động giải phóng.',
    },
    {
      q: 'Nếu tôi lỡ tắt trình duyệt giữa chừng thì sao?',
      a: 'Đơn đặt chỗ sẽ được lưu lại trong mục "Chờ thanh toán" ở trang Vé của tôi. Bạn có thể vào đó để tiếp tục thanh toán.',
    },
    {
      q: 'Tôi có thể hủy vé không?',
      a: 'Vé đã thanh toán có thể hủy trước 3 ngày khởi hành và được hoàn 90% tiền. Vé chưa thanh toán (PENDING) có thể hủy bất cứ lúc nào.',
    },
    {
      q: 'Tiền hoàn lại được trả về đâu?',
      a: 'Tiền hoàn lại sẽ được ghi nhận trong hệ thống. Vui lòng liên hệ hotline 1800 1234 để được hỗ trợ xử lý hoàn tiền về tài khoản.',
    },
    {
      q: 'Tôi tra cứu vé bằng cách nào?',
      a: 'Vào mục "Tra cứu vé" trên thanh điều hướng, nhập mã vé (VD: VE-XXXXXXXX) và số điện thoại đặt vé là bạn sẽ thấy thông tin.',
    },
    {
      q: 'Làm thế nào để lên xe?',
      a: 'Xuất trình mã trong mục "Vé của tôi" cho nhân viên check-in tại bến. Mã có hiệu lực khi vé ở trạng thái "Đã thanh toán".',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20 font-nunito transition-colors duration-300">
      {/* Premium Hero Section */}
      <div className="relative bg-gradient-to-br from-[#e85d04] via-[#f48c06] to-[#faa307] pt-24 pb-32 overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-black/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none"></div>
        <div className="absolute top-1/2 left-3/4 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md shadow-2xl mb-8 border border-white/30 text-white animate-bounce-slow">
            <LifeBuoy className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-md mb-4 tracking-tight">
            Xin chào, chúng tôi có thể giúp gì cho bạn?
          </h1>
          <p className="text-orange-50 text-lg md:text-xl max-w-2xl mx-auto font-medium opacity-90">
            Tìm kiếm câu trả lời nhanh chóng cho mọi thắc mắc về dịch vụ đặt vé trực tuyến của BusGo.
          </p>
          
          {/* Search Bar */}
          <div className="mt-10 max-w-2xl mx-auto bg-white/95 backdrop-blur-xl rounded-full p-2 flex items-center shadow-2xl border border-white/50 focus-within:ring-4 focus-within:ring-white/30 transition-all">
            <div className="pl-6 text-gray-400">
              <i className="ti ti-search text-2xl"></i>
            </div>
            <input 
              type="text" 
              placeholder="Nhập từ khóa (VD: Hủy vé, thanh toán...)"
              className="w-full bg-transparent outline-none px-4 py-3 text-gray-700 placeholder-gray-400 font-medium text-lg"
            />
            <button className="bg-gradient-to-r from-[#e85d04] to-[#dc2f02] hover:shadow-lg hover:shadow-orange-500/30 text-white px-8 py-3 rounded-full font-bold transition-all hover:scale-105 active:scale-95">
              Tìm kiếm
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-20">
        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            { icon: <Bus className="w-6 h-6" />, title: 'Hướng dẫn đặt vé', desc: 'Các bước đơn giản để sở hữu vé xe nhanh chóng.', color: 'text-blue-600', bg: 'bg-blue-100' },
            { icon: <ShieldCheck className="w-6 h-6" />, title: 'Chính sách hoàn/hủy', desc: 'Quy định về việc hủy vé và thời gian nhận tiền hoàn.', color: 'text-green-600', bg: 'bg-green-100' },
            { icon: <Zap className="w-6 h-6" />, title: 'Khắc phục sự cố', desc: 'Xử lý các lỗi thường gặp khi thanh toán mua vé.', color: 'text-purple-600', bg: 'bg-purple-100' }
          ].map((item, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl shadow-orange-900/5 hover:-translate-y-2 transition-transform duration-300 border border-gray-100 dark:border-slate-700 group cursor-pointer">
              <div className={`w-14 h-14 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">{item.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-10">
            {/* Steps Guide */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-slate-700">
              <h2 className="text-2xl font-black text-gray-800 dark:text-gray-100 mb-8 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-[#e85d04]">
                  <Ticket className="w-5 h-5" />
                </div>
                Hướng dẫn đặt vé nhanh
              </h2>
              <div className="relative border-l-2 border-orange-100 dark:border-slate-700 ml-4 space-y-8">
                {[
                  { title: 'Tìm chuyến xe', desc: 'Nhập điểm đi, điểm đến và ngày khởi hành trên trang chủ.' },
                  { title: 'Chọn ghế ngồi', desc: 'Xem sơ đồ xe, chọn vị trí ghế phù hợp với bạn theo thời gian thực.' },
                  { title: 'Nhập thông tin hành khách', desc: 'Điền thông tin liên hệ chính xác để nhận vé điện tử.' },
                  { title: 'Thanh toán an toàn', desc: 'Thanh toán bảo mật qua cổng tích hợp hoặc ví điện tử.' }
                ].map(({ title, desc }, i) => (
                  <div key={i} className="relative pl-8">
                    <span className="absolute -left-[17px] top-1 w-8 h-8 rounded-full bg-[#e85d04] text-white text-sm font-black flex items-center justify-center shadow-lg shadow-orange-500/30 ring-4 ring-white dark:ring-slate-800">
                      {i + 1}
                    </span>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-1">{title}</h3>
                    <p className="text-gray-500 dark:text-gray-400">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQs */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-slate-700">
              <h2 className="text-2xl font-black text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <HelpCircle className="w-5 h-5" />
                </div>
                Câu hỏi thường gặp
              </h2>
              <div className="space-y-4">
                {faqs.map(({ q, a }, i) => (
                  <details key={i} className="group cursor-pointer rounded-2xl bg-gray-50 dark:bg-slate-800/50 p-4 border border-transparent hover:border-gray-200 dark:hover:border-slate-600 transition-colors">
                    <summary className="flex items-center justify-between font-bold text-gray-800 dark:text-gray-100 list-none select-none">
                      <span className="pr-4">{q}</span>
                      <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center text-gray-400 group-open:bg-[#e85d04] group-open:text-white transition-all">
                        <i className="ti ti-chevron-down group-open:rotate-180 transition-transform duration-300" />
                      </div>
                    </summary>
                    <p className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-200/60 dark:border-slate-700 pt-4">
                      {a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar CTA */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-gradient-to-b from-gray-900 to-slate-800 rounded-3xl p-8 text-center text-white shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              
              <div className="w-20 h-20 mx-auto bg-white/10 rounded-full flex items-center justify-center mb-6 backdrop-blur-md border border-white/20">
                <Phone className="w-10 h-10 text-orange-400" />
              </div>
              <h3 className="text-2xl font-black mb-3">Vẫn cần hỗ trợ?</h3>
              <p className="text-gray-300 mb-8 leading-relaxed">
                Đội ngũ tổng đài viên của chúng tôi luôn túc trực 24/7 để giải quyết mọi vấn đề của bạn ngay lập tức.
              </p>
              
              <a href="tel:18001234" className="block w-full bg-gradient-to-r from-[#e85d04] to-[#dc2f02] hover:from-[#dc2f02] hover:to-[#9d0208] text-white py-4 rounded-2xl font-bold text-xl shadow-lg shadow-orange-500/25 transition-all hover:-translate-y-1 active:translate-y-0">
                Gọi ngay 1800 1234
              </a>
              
              <p className="text-xs text-gray-400 mt-4 uppercase tracking-wider font-semibold">
                Miễn phí cước gọi
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
