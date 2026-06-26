export default function TermsPage() {
  const sections = [
    {
      title: '1. Chấp nhận điều khoản',
      content: 'Bằng cách truy cập và sử dụng nền tảng BusGo Việt Nam, bạn đồng ý chịu sự ràng buộc của các Điều khoản sử dụng này. Nếu bạn không đồng ý, vui lòng không sử dụng dịch vụ của chúng tôi.',
    },
    {
      title: '2. Mô tả dịch vụ',
      content: 'BusGo Việt Nam là nền tảng kết nối hành khách với các nhà xe. Chúng tôi cung cấp dịch vụ đặt vé trực tuyến, tra cứu vé, và quản lý đơn hàng. BusGo Việt Nam không trực tiếp cung cấp dịch vụ vận chuyển mà đóng vai trò là trung gian.',
    },
    {
      title: '3. Tài khoản người dùng',
      content: 'Bạn phải cung cấp thông tin chính xác khi đăng ký. Bạn chịu trách nhiệm bảo mật tài khoản và mật khẩu của mình. Thông báo ngay cho chúng tôi nếu phát hiện truy cập trái phép vào tài khoản.',
    },
    {
      title: '4. Đặt vé và thanh toán',
      content: 'Vé chỉ có giá trị sau khi thanh toán thành công. Sau khi chọn ghế, bạn có 15 phút để hoàn tất thanh toán. Giá vé có thể thay đổi tùy theo chuyến đi và nhà xe. Chúng tôi không chịu trách nhiệm về sai sót thông tin do người dùng nhập.',
    },
    {
      title: '5. Hủy vé và hoàn tiền',
      content: 'Chính sách hủy vé và hoàn tiền được mô tả chi tiết trong trang Chính sách hoàn tiền. Nhà xe có quyền thay đổi lịch trình hoặc hủy chuyến. Trong trường hợp đó, hành khách được hoàn 100% tiền vé.',
    },
    {
      title: '6. Trách nhiệm của người dùng',
      content: 'Người dùng cam kết không sử dụng dịch vụ cho mục đích bất hợp pháp, không đặt vé gian lận hoặc sử dụng thông tin thanh toán không hợp lệ. Vi phạm có thể dẫn đến khóa tài khoản vĩnh viễn.',
    },
    {
      title: '7. Giới hạn trách nhiệm',
      content: 'BusGo Việt Nam không chịu trách nhiệm về chậm trễ, tai nạn, mất mát hành lý hoặc các sự cố xảy ra trong quá trình di chuyển. Trách nhiệm tối đa của chúng tôi giới hạn ở giá trị vé bạn đã mua.',
    },
    {
      title: '8. Thay đổi điều khoản',
      content: 'Chúng tôi có quyền sửa đổi Điều khoản sử dụng bất cứ lúc nào. Thay đổi có hiệu lực ngay khi được đăng tải. Tiếp tục sử dụng dịch vụ sau khi thay đổi nghĩa là bạn chấp nhận các điều khoản mới.',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto mb-4">
          <i className="ti ti-file-description text-[#e85d04]" style={{ fontSize: 32 }} />
        </div>
        <h1 className="text-3xl font-black text-gray-800 dark:text-gray-100">Điều khoản sử dụng</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Cập nhật lần cuối: 01/01/2025</p>
      </div>

      <div className="card mb-6 border-orange-200 bg-orange-50 dark:bg-slate-800">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Vui lòng đọc kỹ các điều khoản này trước khi sử dụng dịch vụ của <strong>BusGo Việt Nam</strong>.
          Bằng cách sử dụng nền tảng, bạn xác nhận đã đọc, hiểu và đồng ý với tất cả các điều khoản dưới đây.
        </p>
      </div>

      <div className="space-y-4">
        {sections.map(({ title, content }) => (
          <div key={title} className="card">
            <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-2">{title}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{content}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 card border-gray-200 bg-gray-50 dark:bg-slate-800 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Mọi thắc mắc về điều khoản, vui lòng liên hệ:{' '}
          <a href="mailto:legal@busgovietnam.vn" className="text-[#e85d04] hover:underline font-semibold">legal@busgovietnam.vn</a>
        </p>
      </div>
    </div>
  );
}
