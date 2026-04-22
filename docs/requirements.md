# Yêu Cầu Hệ Thống - Phần Mềm Đặt Vé Xe Khách

## 1. Tổng Quan

Hệ thống đặt vé xe khách là nền tảng số hóa kết nối hành khách và các đơn vị vận tải.

### Các nhóm đối tượng (Actors)

| Actor | Mô tả |
|-------|--------|
| **Khách hàng** | Tìm kiếm, đặt vé, thanh toán, quản lý lịch sử đi lại |
| **Nhà xe** | Quản lý xe, tuyến đường, lịch trình, giá vé, doanh thu |
| **Nhân viên / Tài xế** | Soát vé, xác nhận hành khách, cập nhật trạng thái chuyến |
| **Admin** | Phê duyệt nhà xe, cấu hình hệ thống, audit log |

---

## 2. Yêu Cầu Chức Năng

### 2.1 Khách Hàng

| STT | Chức năng | Mô tả |
|-----|-----------|--------|
| KH-01 | Đăng ký / Đăng nhập / Đăng xuất | Email không trùng, mật khẩu ≥ 6 ký tự, hỗ trợ OTP |
| KH-02 | Quản lý thông tin cá nhân | Cập nhật profile, đổi mật khẩu, quên mật khẩu |
| KH-03 | Xóa tài khoản | Anonymize dữ liệu, giữ lịch sử giao dịch 5 năm |
| KH-04 | Tìm kiếm và lọc chuyến xe | Lọc theo giá, nhà xe, giờ khởi hành, loại xe |
| KH-05 | Xem chi tiết chuyến xe | Sơ đồ ghế real-time |
| KH-06 | Đặt vé và chọn ghế | Khóa ghế 15 phút, tối đa 5 ghế/chuyến |
| KH-07 | Thanh toán | Ví điện tử, thẻ ngân hàng, chuyển khoản, tiền mặt |
| KH-08 | Quản lý lịch sử vé | Xem, tải vé điện tử/QR |
| KH-09 | Hủy / Đổi vé | Theo chính sách hoàn tiền của nhà xe |
| KH-10 | Đánh giá | 1-5 sao, chỉ khi đã hoàn thành chuyến |

### 2.2 Nhà Xe

| STT | Chức năng | Mô tả |
|-----|-----------|--------|
| NX-01 | Quản lý tài khoản | Đăng ký, đăng nhập, cập nhật thông tin |
| NX-02 | Quản lý loại xe & Sơ đồ ghế | Thêm/sửa/xóa xe, thiết lập layout ghế |
| NX-03 | Quản lý tuyến xe | Tạo/cập nhật/xóa tuyến |
| NX-04 | Quản lý chuyến xe | Tạo chuyến, gán tuyến + tài xế + xe + thời gian |
| NX-05 | Quản lý ghế & Đặt chỗ | Theo dõi real-time: Trống / Đang chọn / Đã bán |
| NX-06 | Quản lý giá vé | Giá cơ bản + phụ thu ngày lễ/cuối tuần |
| NX-07 | Thống kê & Báo cáo | Doanh thu theo ngày/tháng/năm, số vé bán ra |

### 2.3 Nhân Viên / Tài Xế

| STT | Chức năng | Mô tả |
|-----|-----------|--------|
| NV-01 | Đăng nhập / Đăng xuất | Tài khoản nhân sự |
| NV-02 | Tra cứu danh sách vé | Xem chi tiết vé theo chuyến |
| NV-03 | Kiểm tra hành khách | Danh sách hành khách theo chuyến |
| NV-04 | Xác nhận vé | Check-in hành khách lên xe |
| NV-05 | Cập nhật trạng thái chuyến | Chưa khởi hành → Đang chạy → Hoàn thành |
| NV-06 | Kiểm tra sơ đồ ghế | Tra cứu ghế đã đặt / còn trống |
| NV-07 | Hỗ trợ khách hàng | Đổi/hủy vé tại hiện trường |

### 2.4 Admin

| STT | Chức năng | Mô tả |
|-----|-----------|--------|
| AD-01 | Đăng nhập / Đăng xuất | |
| AD-02 | Quản lý tài khoản | Tạo, khóa, xóa, phân quyền |
| AD-03 | Phê duyệt nhà xe | Xem xét và duyệt đăng ký nhà xe |
| AD-04 | Quản lý tuyến xe toàn hệ thống | Thêm/sửa/xóa tuyến xe |
| AD-05 | Quản lý hệ thống | Cấu hình, sao lưu, khôi phục dữ liệu |
| AD-06 | Thống kê & Báo cáo | Doanh thu hệ thống, số vé bán |
| AD-07 | Audit & Kiểm soát | Ghi log hoạt động, kiểm duyệt đánh giá |

---

## 3. Quy Định Nghiệp Vụ

### QD_ACC — Tài khoản
| Mã | Quy định |
|----|----------|
| QD_ACC_01 | Định danh duy nhất bởi Email hoặc SĐT |
| QD_ACC_02 | Mật khẩu tối thiểu 6 ký tự |
| QD_ACC_03 | OTP bắt buộc cho: đổi mật khẩu, thanh toán lần đầu, xóa tài khoản |
| QD_ACC_04 | Xóa tài khoản: Anonymize dữ liệu, giữ lịch sử giao dịch 5 năm |

### QD_BOOK — Đặt vé & Giữ chỗ
| Mã | Quy định |
|----|----------|
| QD_BOOK_01 | Ghế chuyển sang "Processing" và khóa 15 phút khi khách chọn |
| QD_BOOK_02 | Hệ thống tự động giải phóng ghế sau 15 phút không thanh toán |
| QD_BOOK_03 | Tối đa 5 ghế / tài khoản / chuyến xe |

### QD_OP — Vận hành Nhà xe
| Mã | Quy định |
|----|----------|
| QD_OP_01 | Chốt danh sách hành khách trước 15 phút khởi hành |
| QD_OP_02 | Giá vé đã thanh toán không thay đổi khi nhà xe cập nhật giá mới |
| QD_OP_03 | Nhà xe hủy chuyến → hoàn 100% tự động cho toàn bộ khách |

### ST_FLOW — Vòng đời Vé
```
PENDING → PAID → COMPLETED
                ↘ REFUNDED (nếu đủ điều kiện thời gian)
         ↘ CANCELLED
```

### Chính sách hoàn tiền (mặc định)
| Thời gian trước khởi hành | Hoàn tiền |
|---------------------------|-----------|
| > 24 giờ | 100% |
| 12 – 24 giờ | 70% |
| < 12 giờ | 0% |
| Nhà xe hủy chuyến | 100% (tự động) |

---

## 4. Yêu Cầu Chất Lượng (Non-Functional)

| STT | Yêu cầu | Mô tả |
|-----|---------|--------|
| 1 | Hiệu năng | Phản hồi tra cứu ≤ 3 giây |
| 2 | Tính sẵn sàng | Uptime cao cho đặt vé, thanh toán, tra cứu |
| 3 | Toàn vẹn dữ liệu | Khóa ghế atomic, không double-booking |
| 4 | Bảo mật | JWT, OTP, phân quyền RBAC |
| 5 | Độ tin cậy | Xử lý chính xác đặt vé, thanh toán, hủy vé |
| 6 | Khả năng khôi phục | Backup hàng ngày, restore khi sự cố |
| 7 | Kiểm soát & Truy vết | Audit log, kiểm duyệt review |
| 8 | Khả năng sử dụng | Giao diện rõ ràng cho 4 nhóm người dùng |
| 9 | Khả năng mở rộng | Scale số nhà xe, tuyến, chuyến, user |
| 10 | Khả năng bảo trì | Module hóa theo chức năng |
