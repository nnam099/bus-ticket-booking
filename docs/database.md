# Thiết Kế Cơ Sở Dữ Liệu

Database dùng PostgreSQL và Prisma. Schema chính nằm tại `backend/prisma/schema.prisma`.

## Nhóm bảng

### Identity & Access

| Bảng | Mô tả |
| --- | --- |
| `users` | Thông tin đăng nhập, trạng thái tài khoản, cờ anonymize |
| `roles` | Vai trò: `CUSTOMER`, `BUS_OPERATOR`, `STAFF`, `ADMIN` |
| `user_roles` | Quan hệ nhiều-nhiều giữa user và role |
| `otp_codes` | OTP theo mục đích như đăng ký, reset mật khẩu, thanh toán |

### Customer & Operator

| Bảng | Mô tả |
| --- | --- |
| `customers` | Hồ sơ khách hàng, điểm tích lũy |
| `bus_operators` | Hồ sơ nhà xe, giấy phép, hotline, trạng thái duyệt |
| `staffs` | Nhân viên/tài xế của nhà xe |

### Fleet & Route

| Bảng | Mô tả |
| --- | --- |
| `vehicle_types` | Loại xe và số ghế chuẩn |
| `seat_layouts` | Sơ đồ ghế theo loại xe, gồm tầng, hàng, cột, mã ghế |
| `vehicles` | Xe vật lý của nhà xe |
| `routes` | Tuyến đường của nhà xe |

Thiết kế dùng `vehicle_types` và `seat_layouts` làm template. Khi tạo chuyến, hệ thống sinh `trip_seats` từ layout của loại xe.

### Trip Operations

| Bảng | Mô tả |
| --- | --- |
| `trips` | Chuyến xe cụ thể: tuyến, xe, giờ đi, giờ đến dự kiến, giá |
| `trip_staffs` | Phân công tài xế/nhân viên cho chuyến |
| `trip_seats` | Tồn kho ghế theo từng chuyến |

Trạng thái chuyến:

```text
SCHEDULED | BOARDING | DEPARTED | COMPLETED | DELAYED | CANCELLED
```

Trạng thái ghế:

```text
AVAILABLE   - còn trống
PROCESSING  - đang được giữ tạm
BOOKED      - đã thanh toán
UNAVAILABLE - không bán
```

### Transaction & Payment

| Bảng | Mô tả |
| --- | --- |
| `orders` | Đơn hàng của khách |
| `payments` | Lịch sử giao dịch thanh toán |
| `ticket_details` | Vé chi tiết, mỗi vé gắn với một ghế của chuyến |
| `reviews` | Đánh giá chuyến đi sau khi vé hoàn tất |

Trạng thái order:

```text
PENDING | PAID | CANCELLED | REFUNDED
```

Trạng thái payment:

```text
PENDING | SUCCESS | FAILED | REFUNDED
```

Trạng thái vé:

```text
PENDING -> PAID -> COMPLETED
              \-> REFUNDED
       \-> CANCELLED
```

### Audit & Config

| Bảng | Mô tả |
| --- | --- |
| `audit_logs` | Nhật ký hành động hệ thống |
| `system_configs` | Cấu hình nghiệp vụ như thời gian giữ ghế, chính sách hoàn tiền |

## Ràng buộc quan trọng

Chống double-booking:

```sql
UNIQUE (trip_seat_id) ON ticket_details
```

Mỗi ghế layout chỉ xuất hiện một lần trong một chuyến:

```sql
UNIQUE (trip_id, seat_layout_id) ON trip_seats
```

Chống review trùng:

```sql
UNIQUE (ticket_detail_id) ON reviews
```

## Index chính

```sql
-- Tìm chuyến theo ngày và trạng thái
CREATE INDEX trips_departure_time_status_idx ON trips(departure_time, status);

-- Tìm tuyến theo thành phố
CREATE INDEX routes_origin_city_destination_city_idx ON routes(origin_city, destination_city);

-- Tra cứu ghế theo chuyến và trạng thái
CREATE INDEX trip_seats_trip_id_status_idx ON trip_seats(trip_id, status);

-- Tra cứu order theo khách
CREATE INDEX orders_customer_id_idx ON orders(customer_id);

-- Tra cứu ticket theo order
CREATE INDEX ticket_details_order_id_idx ON ticket_details(order_id);
```

## Logic khóa ghế

1. Khách chọn ghế.
2. Backend dùng Redis key `seat_lock:{tripId}:{tripSeatId}` với TTL mặc định 15 phút.
3. Nếu lock thành công, DB cập nhật `trip_seats.status = PROCESSING`.
4. Nếu thanh toán thành công, DB cập nhật ghế sang `BOOKED`, vé sang `PAID`.
5. Nếu thanh toán thất bại hoặc hủy giữ chỗ, ghế quay về `AVAILABLE`.

## Dữ liệu seed

`backend/prisma/seed.js` tạo dữ liệu đủ để demo luồng chính:

- Roles và tài khoản mẫu
- Nhà xe đã duyệt
- Tài xế demo
- Loại xe, layout ghế, xe vật lý
- Tuyến và chuyến trong 14 ngày tới
- Ghế theo từng chuyến
- Cấu hình nghiệp vụ mặc định
