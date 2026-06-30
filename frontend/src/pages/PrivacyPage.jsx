export default function PrivacyPage() {
  const sections = [
    {
      title: '1. Thông tin chúng tôi thu thập',
      items: [
        'Thông tin cá nhân: họ tên, email, số điện thoại khi đăng ký tài khoản.',
        'Thông tin đặt vé: tên hành khách, số điện thoại, lịch sử chuyến đi.',
        'Thông tin thanh toán: phương thức thanh toán (chúng tôi không lưu số thẻ đầy đủ).',
        'Dữ liệu kỹ thuật: địa chỉ IP, loại thiết bị, trình duyệt, thời gian truy cập.',
      ],
    },
    {
      title: '2. Cách chúng tôi sử dụng thông tin',
      items: [
        'Xử lý đặt vé và cung cấp dịch vụ cho bạn.',
        'Gửi xác nhận đặt vé, cập nhật trạng thái chuyến đi.',
        'Hỗ trợ khách hàng và xử lý khiếu nại.',
        'Cải thiện nền tảng và trải nghiệm người dùng.',
        'Tuân thủ yêu cầu pháp lý của cơ quan nhà nước khi cần thiết.',
      ],
    },
    {
      title: '3. Chia sẻ thông tin',
      items: [
        'Chúng tôi chia sẻ thông tin cần thiết với nhà xe để xử lý đặt vé.',
        'Chia sẻ với đơn vị thanh toán để xử lý giao dịch (ví điện tử, ngân hàng).',
        'Không bán, trao đổi hoặc cho thuê thông tin cá nhân với bên thứ ba vì mục đích thương mại.',
        'Có thể công khai thông tin khi có yêu cầu hợp pháp từ cơ quan nhà nước.',
      ],
    },
    {
      title: '4. Bảo mật dữ liệu',
      items: [
        'Dữ liệu nhạy cảm (tên, số điện thoại hành khách) được mã hóa trước khi lưu trữ.',
        'Sử dụng kết nối HTTPS để bảo vệ dữ liệu truyền tải.',
        'Kiểm soát truy cập nghiêm ngặt, chỉ nhân viên có thẩm quyền mới được xem dữ liệu cá nhân.',
        'Định kỳ kiểm tra bảo mật và cập nhật hệ thống.',
      ],
    },
    {
      title: '5. Quyền của người dùng',
      items: [
        'Quyền truy cập: yêu cầu xem dữ liệu cá nhân chúng tôi đang lưu.',
        'Quyền chỉnh sửa: cập nhật thông tin cá nhân trong phần Hồ sơ tài khoản.',
        'Quyền xóa: yêu cầu xóa tài khoản — dữ liệu sẽ được ẩn danh hóa.',
        'Quyền phản đối: từ chối nhận email tiếp thị bất cứ lúc nào.',
      ],
    },
    {
      title: '6. Cookie',
      items: [
        'Chúng tôi sử dụng cookie phiên (session) để duy trì đăng nhập.',
        'Cookie phân tích giúp chúng tôi hiểu cách người dùng sử dụng nền tảng.',
        'Bạn có thể tắt cookie trong cài đặt trình duyệt, tuy nhiên có thể ảnh hưởng đến trải nghiệm.',
      ],
    },
    {
      title: '7. Thay đổi chính sách',
      items: [
        'Chính sách này có thể được cập nhật định kỳ.',
        'Thay đổi quan trọng sẽ được thông báo qua email hoặc thông báo trên ứng dụng.',
        'Tiếp tục sử dụng dịch vụ sau khi thay đổi nghĩa là bạn chấp nhận chính sách mới.',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20 font-nunito transition-colors duration-300">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 pt-20 pb-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/4"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-900/20 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="max-w-3xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md shadow-xl border border-white/30 text-white mb-6 animate-pulse">
            <i className="ti ti-shield-lock text-4xl" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 drop-shadow-md">Chính sách bảo mật</h1>
          <p className="text-emerald-100 text-lg font-medium">Cập nhật lần cuối: 01/01/2025</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-20 relative z-20">

      <div className="card mb-6 border-orange-200 bg-orange-50 dark:bg-slate-800">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          <strong>BusGo Việt Nam</strong> cam kết bảo vệ quyền riêng tư của bạn.
          Chính sách này mô tả cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn khi sử dụng dịch vụ.
        </p>
      </div>

      <div className="space-y-4">
        {sections.map(({ title, items }) => (
          <div key={title} className="card">
            <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-3">{title}</h2>
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <span className="text-[#e85d04] flex-shrink-0 mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-8 card border-emerald-200 bg-emerald-50 dark:bg-slate-800 text-center shadow-lg">
        <p className="font-semibold text-gray-800 dark:text-gray-100 mb-1">Liên hệ về quyền riêng tư</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Email:{' '}
          <a href="mailto:privacy@busgovietnam.vn" className="text-emerald-600 hover:underline font-semibold">privacy@busgovietnam.vn</a>
          {' '}· Hotline:{' '}
          <a href="tel:18001234" className="text-emerald-600 hover:underline font-semibold">1800 1234</a>
        </p>
      </div>
      </div>
    </div>
  );
}
