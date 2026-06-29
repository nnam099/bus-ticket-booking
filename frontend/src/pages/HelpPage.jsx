import { Bus, HelpCircle, Phone } from 'lucide-react';

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
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto mb-4">
          <i className="ti ti-help text-[#e85d04]" style={{ fontSize: 32 }} />
        </div>
        <h1 className="text-3xl font-black text-gray-800 dark:text-gray-100">Trung tâm trợ giúp</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Tìm câu trả lời cho các câu hỏi thường gặp</p>
      </div>

      {/* Steps */}
      <div className="card mb-8">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Bus className="w-5 h-5 text-brand" /> Hướng dẫn đặt vé nhanh
        </h2>
        <ol className="space-y-3">
          {[
            { title: 'Tìm chuyến xe', desc: 'Nhập điểm đi, điểm đến và ngày khởi hành trên trang chủ.' },
            { title: 'Chọn ghế ngồi', desc: 'Xem sơ đồ xe, chọn vị trí ghế phù hợp với bạn.' },
            { title: 'Nhập thông tin hành khách', desc: 'Điền họ tên và số điện thoại cho từng ghế.' },
            { title: 'Thanh toán', desc: 'Chọn phương thức: ví điện tử, thẻ ngân hàng hoặc tiền mặt tại quầy.' },
            { title: 'Nhận vé điện tử', desc: 'Vé hiển thị ngay trong mục "Vé của tôi" sau khi thanh toán thành công.' },
          ].map(({ title, desc }, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span className="w-7 h-7 rounded-full bg-[#e85d04] text-white text-sm font-black flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
              <div>
                <p className="font-bold text-gray-800 dark:text-gray-100">{title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* FAQ */}
      <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-brand" /> Câu hỏi thường gặp
      </h2>
      <div className="space-y-3">
        {faqs.map(({ q, a }, i) => (
          <details key={i} className="card group cursor-pointer">
            <summary className="flex items-center justify-between font-semibold text-gray-800 dark:text-gray-100 list-none cursor-pointer select-none">
              <span>{q}</span>
              <i className="ti ti-chevron-down text-gray-400 group-open:rotate-180 transition-transform duration-200" />
            </summary>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-gray-700 pt-3">{a}</p>
          </details>
        ))}
      </div>

      {/* Contact CTA */}
      <div className="mt-10 card border-orange-200 bg-orange-50 dark:bg-slate-800 text-center">
        <p className="font-bold text-gray-800 dark:text-gray-100">Không tìm thấy câu trả lời?</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Liên hệ tổng đài hỗ trợ miễn phí</p>
        <a href="tel:18001234" className="mt-4 inline-flex items-center justify-center gap-2 btn-primary px-8 py-3 text-base">
          <Phone className="w-5 h-5" /> 1800 1234
        </a>
      </div>
    </div>
  );
}
