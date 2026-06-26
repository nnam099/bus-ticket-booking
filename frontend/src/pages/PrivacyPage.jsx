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
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto mb-4">
          <i className="ti ti-shield-lock text-[#e85d04]" style={{ fontSize: 32 }} />
        </div>
        <h1 className="text-3xl font-black text-gray-800 dark:text-gray-100">Chính sách bảo mật</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Cập nhật lần cuối: 01/01/2025</p>
      </div>

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

      <div className="mt-8 card border-gray-200 bg-gray-50 dark:bg-slate-800 text-center">
        <p className="font-semibold text-gray-800 dark:text-gray-100 mb-1">Liên hệ về quyền riêng tư</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Email:{' '}
          <a href="mailto:privacy@busgovietnam.vn" className="text-[#e85d04] hover:underline font-semibold">privacy@busgovietnam.vn</a>
          {' '}· Hotline:{' '}
          <a href="tel:18001234" className="text-[#e85d04] hover:underline font-semibold">1800 1234</a>
        </p>
      </div>
    </div>
  );
}
