# API Reference

Base URL: `http://localhost:3000/api`

Tất cả response có dạng:
```json
{ "success": true/false, "data": {...}, "message": "..." }
```

---

## Auth

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| POST | `/auth/register` | ❌ | Đăng ký khách hàng |
| POST | `/auth/login` | ❌ | Đăng nhập |
| POST | `/auth/send-otp` | ❌ | Gửi OTP qua email/SĐT |
| POST | `/auth/verify-otp` | ❌ | Xác thực OTP |
| POST | `/auth/forgot-password` | ❌ | Quên mật khẩu |
| POST | `/auth/reset-password` | ❌ | Đặt lại mật khẩu |

---

## Users

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| GET | `/users/me` | ✅ | Thông tin tài khoản |
| PUT | `/users/me` | ✅ | Cập nhật thông tin |
| PUT | `/users/me/password` | ✅ | Đổi mật khẩu |
| GET | `/users/me/tickets` | ✅ CUSTOMER | Lịch sử vé |
| DELETE | `/users/me` | ✅ | Xóa tài khoản (anonymize) |

---

## Trips

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| GET | `/trips/search?origin=&destination=&date=` | ❌ | Tìm kiếm chuyến xe |
| GET | `/trips/:id` | ❌ | Chi tiết chuyến + sơ đồ ghế |
| POST | `/trips` | ✅ BUS_OPERATOR | Tạo chuyến xe mới |
| PATCH | `/trips/:id/status` | ✅ STAFF/BUS_OPERATOR | Cập nhật trạng thái chuyến |

---

## Bookings

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| POST | `/bookings/lock` | ✅ CUSTOMER | Khóa ghế 15 phút |
| POST | `/bookings/release` | ✅ CUSTOMER | Giải phóng ghế |
| POST | `/bookings/confirm` | ✅ CUSTOMER | Xác nhận đặt vé (sau thanh toán) |
| DELETE | `/bookings/tickets/:id` | ✅ CUSTOMER | Hủy vé |

---

## Payments

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| POST | `/payments/initiate` | ✅ CUSTOMER | Khởi tạo giao dịch |
| POST | `/payments/callback` | ❌ (webhook) | Callback từ cổng thanh toán |
| GET | `/payments/order/:orderId` | ✅ | Lịch sử thanh toán theo đơn |

---

## Tickets

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| GET | `/tickets/:id` | ✅ | Chi tiết vé + QR code |
| PATCH | `/tickets/:id/check-in` | ✅ STAFF | Xác nhận khách lên xe |
| GET | `/tickets/trip/:tripId` | ✅ STAFF | Danh sách vé theo chuyến |

---

## Reviews

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| POST | `/reviews` | ✅ CUSTOMER | Gửi đánh giá (phải có vé COMPLETED) |
| GET | `/reviews/operator/:id` | ❌ | Đánh giá của nhà xe |

---

## Operators

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| GET | `/operators` | ❌ | Danh sách nhà xe |
| GET | `/operators/:id` | ❌ | Chi tiết nhà xe |
| GET | `/operators/me/dashboard` | ✅ BUS_OPERATOR | Thống kê doanh thu |
| PUT | `/operators/me` | ✅ BUS_OPERATOR | Cập nhật thông tin nhà xe |

---

## Admin

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| GET | `/admin/stats` | ✅ ADMIN | Thống kê hệ thống |
| GET | `/admin/operators/pending` | ✅ ADMIN | Nhà xe chờ duyệt |
| PATCH | `/admin/operators/:id/approve` | ✅ ADMIN | Duyệt nhà xe |
| PATCH | `/admin/users/:id/toggle-active` | ✅ ADMIN | Khóa/mở khóa tài khoản |
| GET | `/admin/audit-logs` | ✅ ADMIN | Lịch sử hoạt động |
| GET | `/admin/reviews/pending` | ✅ ADMIN | Đánh giá chờ duyệt |
| PATCH | `/admin/reviews/:id/approve` | ✅ ADMIN | Duyệt đánh giá |

---

## WebSocket Events

Kết nối: `ws://localhost:3000` với `auth: { token: "..." }`

| Event (emit) | Payload | Mô tả |
|-------------|---------|--------|
| `join:trip` | `tripId` | Đăng ký nhận cập nhật ghế của chuyến |
| `leave:trip` | `tripId` | Huỷ đăng ký |

| Event (on) | Payload | Mô tả |
|-----------|---------|--------|
| `seats:updated` | `{ seatIds, status }` | Cập nhật trạng thái ghế real-time |
