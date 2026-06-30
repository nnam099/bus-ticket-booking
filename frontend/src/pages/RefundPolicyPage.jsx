export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20 font-nunito transition-colors duration-300">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-rose-500 via-red-500 to-pink-600 pt-20 pb-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/4"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-900/30 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="max-w-3xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md shadow-xl border border-white/30 text-white mb-6">
            <i className="ti ti-receipt-refund text-4xl" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 drop-shadow-md">Chính sách hoàn tiền</h1>
          <p className="text-red-100 text-lg font-medium">Cập nhật lần cuối: 01/01/2025</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-20 relative z-20">

      <div className="space-y-6">
        {/* Tóm tắt */}
        <div className="card border-orange-200 bg-orange-50 dark:bg-slate-800">
          <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-3">📋 Tóm tắt chính sách</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-orange-200 dark:border-slate-700">
                  <th className="text-left py-2 font-bold text-gray-700 dark:text-gray-200">Thời điểm hủy</th>
                  <th className="text-left py-2 font-bold text-gray-700 dark:text-gray-200">Mức hoàn tiền</th>
                </tr>
              </thead>
              <tbody className="space-y-1">
                {[
                  { time: 'Trước khởi hành ≥ 3 ngày', refund: '90% giá vé' },
                  { time: 'Trước khởi hành < 3 ngày (vé đã thanh toán)', refund: 'Không hoàn tiền' },
                  { time: 'Vé chưa thanh toán (PENDING)', refund: 'Hủy miễn phí, không mất phí' },
                ].map(({ time, refund }) => (
                  <tr key={time} className="border-b border-orange-100 dark:border-slate-700">
                    <td className="py-2.5 text-gray-600 dark:text-gray-300">{time}</td>
                    <td className={`py-2.5 font-semibold ${refund.includes('Không') ? 'text-red-600' : 'text-green-600'}`}>{refund}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {[
          {
            title: '1. Điều kiện hủy vé',
            content: [
              'Chỉ áp dụng cho vé ở trạng thái "Đã thanh toán" (PAID) hoặc "Chờ thanh toán" (PENDING).',
              'Vé đã được check-in (Đã lên xe) hoặc đã hoàn thành chuyến đi không được phép hủy.',
              'Mỗi yêu cầu hủy vé chỉ áp dụng cho một vé riêng lẻ, không áp dụng theo đơn hàng.',
            ],
          },
          {
            title: '2. Cách thức hoàn tiền',
            content: [
              'Tiền hoàn sẽ được ghi nhận vào hệ thống trong vòng 1–3 ngày làm việc.',
              'Với vé thanh toán qua ví điện tử hoặc thẻ ngân hàng, tiền sẽ được hoàn về phương thức thanh toán gốc.',
              'Khách hàng vui lòng liên hệ hotline 1800 1234 để được hỗ trợ xử lý hoàn tiền.',
            ],
          },
          {
            title: '3. Quy trình hủy vé',
            content: [
              'Đăng nhập tài khoản → Vào mục "Vé của tôi" → Chọn vé cần hủy → Nhấn "Hủy vé".',
              'Hệ thống sẽ thông báo mức hoàn tiền trước khi bạn xác nhận.',
              'Sau khi xác nhận, trạng thái vé sẽ chuyển sang "Đã hủy" hoặc "Đã hoàn tiền".',
            ],
          },
          {
            title: '4. Các trường hợp đặc biệt',
            content: [
              'Nếu nhà xe hủy chuyến: Khách hàng được hoàn 100% tiền vé mà không mất phí.',
              'Nếu chuyến bị chậm trên 2 tiếng mà khách không muốn đi: Liên hệ hotline để được hỗ trợ.',
              'BusGo Việt Nam không chịu trách nhiệm với các thiệt hại gián tiếp do hủy/hoãn chuyến.',
            ],
          },
        ].map(({ title, content }) => (
          <div key={title} className="card">
            <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-3">{title}</h2>
            <ul className="space-y-2">
              {content.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <span className="text-[#e85d04] flex-shrink-0 mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="card border-rose-200 bg-rose-50 dark:bg-slate-800 text-center shadow-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">Cần hỗ trợ thêm? Gọi ngay <a href="tel:18001234" className="font-bold text-rose-600 hover:underline">1800 1234</a> (miễn phí) hoặc email <a href="mailto:hello@busgovietnam.vn" className="text-rose-600 hover:underline">hello@busgovietnam.vn</a></p>
        </div>
      </div>
      </div>
    </div>
  );
}
