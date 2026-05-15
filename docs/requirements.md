# Yêu Cầu Hệ Thống

## Tổng quan

Hệ thống đặt vé xe khách hỗ trợ khách hàng tìm chuyến, giữ ghế, thanh toán và quản lý vé. Nhà xe quản lý tuyến, xe và chuyến đi. Nhân viên hỗ trợ vận hành chuyến, còn admin kiểm soát hệ thống.

## Actor

| Actor | Mô tả |
| --- | --- |
| Khách hàng | Tìm chuyến, đặt vé, thanh toán, xem/hủy vé, đánh giá |
| Nhà xe | Quản lý hồ sơ nhà xe, xe, tuyến, chuyến và doanh thu |
| Nhân viên/Tài xế | Xem chuyến được phân công, danh sách hành khách, check-in |
| Admin | Duyệt nhà xe, quản lý tài khoản, audit log, duyệt đánh giá |

## Chức năng khách hàng

| Mã | Chức năng | Mô tả |
| --- | --- | --- |
| KH-01 | Đăng ký/đăng nhập | Đăng nhập bằng email hoặc số điện thoại, JWT Bearer token |
| KH-02 | Quản lý hồ sơ | Xem/cập nhật thông tin cá nhân, đổi mật khẩu |
| KH-03 | Xóa tài khoản | Anonymize email, số điện thoại và khóa tài khoản |
| KH-04 | Tìm chuyến | Tìm theo điểm đi, điểm đến, ngày, giá, nhà xe |
| KH-05 | Xem chuyến | Xem thông tin tuyến, xe, giá, ghế |
| KH-06 | Giữ ghế | Khóa ghế tạm thời 15 phút bằng Redis |
| KH-07 | Đặt vé | Tạo order và ticket từ ghế đang giữ |
| KH-08 | Thanh toán | Mock payment local hoặc callback gateway |
| KH-09 | Quản lý vé | Xem chi tiết vé, lịch sử vé |
| KH-10 | Hủy vé | Tính hoàn tiền theo thời gian trước khởi hành |
| KH-11 | Đánh giá | Chỉ đánh giá khi vé đã hoàn tất |

## Chức năng nhà xe

| Mã | Chức năng | Mô tả |
| --- | --- | --- |
| NX-01 | Cập nhật hồ sơ | Tên nhà xe, hotline, địa chỉ, mô tả, logo |
| NX-02 | Quản lý xe | Thêm/sửa/xóa mềm xe của nhà xe |
| NX-03 | Quản lý tuyến | Thêm/sửa/xóa mềm tuyến |
| NX-04 | Tạo chuyến | Chọn tuyến, xe, giờ đi, giờ đến, giá |
| NX-05 | Theo dõi vé | Xem vé đã thanh toán theo chuyến |
| NX-06 | Cập nhật trạng thái chuyến | Boarding, on route, completed, delayed, cancelled |
| NX-07 | Báo cáo | Doanh thu, số chuyến, số vé theo ngày/tháng/năm |

## Chức năng nhân viên

| Mã | Chức năng | Mô tả |
| --- | --- | --- |
| NV-01 | Xem chuyến | Danh sách chuyến được phân công |
| NV-02 | Xem hành khách | Danh sách khách đã thanh toán/hoàn tất |
| NV-03 | Check-in | Xác nhận khách lên xe |
| NV-04 | Cập nhật chuyến | Cập nhật trạng thái chuyến được phân công |

## Chức năng admin

| Mã | Chức năng | Mô tả |
| --- | --- | --- |
| AD-01 | Thống kê hệ thống | Tổng user, nhà xe, chuyến, doanh thu |
| AD-02 | Duyệt nhà xe | Phê duyệt nhà xe chờ duyệt |
| AD-03 | Quản lý tài khoản | Khóa/mở khóa user |
| AD-04 | Audit log | Xem nhật ký hoạt động |
| AD-05 | Duyệt đánh giá | Kiểm duyệt review trước khi public |

## Quy định nghiệp vụ

| Mã | Quy định |
| --- | --- |
| QD_ACC_01 | User định danh bằng email hoặc số điện thoại duy nhất |
| QD_ACC_02 | Mật khẩu tối thiểu 6 ký tự |
| QD_ACC_03 | Xóa tài khoản dùng anonymize, không xóa lịch sử giao dịch |
| QD_BOOK_01 | Ghế chuyển sang `PROCESSING` khi khách giữ |
| QD_BOOK_02 | Thời gian giữ ghế mặc định là 15 phút |
| QD_BOOK_03 | Mỗi lần giữ/đặt tối đa 5 ghế |
| QD_PAY_01 | Thanh toán thành công chuyển order/ticket sang `PAID`, ghế sang `BOOKED` |
| QD_PAY_02 | Thanh toán thất bại hủy order pending và trả ghế về `AVAILABLE` |
| QD_OP_01 | Nhà xe/tài xế chỉ được thao tác chuyến thuộc phạm vi quản lý |
| QD_OP_02 | Hủy chuyến hoàn 100% cho vé đã thanh toán |
| QD_REVIEW_01 | Review chỉ được tạo từ vé `COMPLETED` |

## Chính sách hoàn tiền

| Thời gian trước khởi hành | Tỷ lệ hoàn |
| --- | --- |
| Trên 24 giờ | 100% |
| Từ 12 đến 24 giờ | 70% |
| Dưới 12 giờ | 0% |
| Nhà xe hủy chuyến | 100% |

## Yêu cầu phi chức năng

| Nhóm | Yêu cầu |
| --- | --- |
| Bảo mật | JWT, phân quyền RBAC, rate limit endpoint auth/API |
| Toàn vẹn dữ liệu | Unique constraint chống double-booking |
| Hiệu năng | Tìm chuyến theo index ngày, trạng thái và tuyến |
| Realtime | Socket.IO cập nhật trạng thái ghế |
| Khả dụng local | Docker Compose chạy PostgreSQL, Redis, backend, frontend |
| Bảo trì | Backend chia theo routes, services, middlewares, config |
