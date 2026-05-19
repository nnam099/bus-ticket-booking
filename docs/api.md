# API Reference

Base URL: `http://localhost:3000/api`

Response mặc định:

```json
{ "success": true, "data": {}, "message": "..." }
```

Các endpoint có `Auth` cần header:

```http
Authorization: Bearer <jwt>
```

## Auth

| Method | Endpoint | Auth | Mô tả |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Đăng ký khách hàng |
| POST | `/auth/login` | Public | Đăng nhập bằng `identifier`, `email` hoặc `phone` |
| POST | `/auth/send-otp` | Public | Gửi OTP |
| POST | `/auth/verify-otp` | Public | Xác thực OTP |
| POST | `/auth/forgot-password` | Public | Bắt đầu quên mật khẩu |
| POST | `/auth/reset-password` | Public | Đặt lại mật khẩu |

## Users

| Method | Endpoint | Auth | Mô tả |
| --- | --- | --- | --- |
| GET | `/users/me` | User | Thông tin tài khoản hiện tại |
| PUT | `/users/me` | User | Cập nhật hồ sơ khách hàng |
| PUT | `/users/me/password` | User | Đổi mật khẩu |
| GET | `/users/me/tickets` | Customer | Danh sách vé của khách hàng |
| DELETE | `/users/me` | User | Xóa tài khoản theo hướng anonymize |

## Trips

| Method | Endpoint | Auth | Mô tả |
| --- | --- | --- | --- |
| GET | `/trips/search?origin=&destination=&date=&minPrice=&maxPrice=&operatorId=` | Public | Tìm chuyến theo tuyến, ngày và bộ lọc |
| GET | `/trips/:id` | Public | Chi tiết chuyến, xe, tuyến, ghế và nhân sự |
| GET | `/trips/operator/me` | Bus operator | Danh sách chuyến của nhà xe đang đăng nhập |
| POST | `/trips` | Bus operator | Tạo chuyến, tự sinh ghế theo layout xe |
| PATCH | `/trips/:id/status` | Staff, Bus operator | Cập nhật trạng thái chuyến |

Trạng thái chuyến hợp lệ khi cập nhật: `BOARDING`, `DEPARTED`, `COMPLETED`, `DELAYED`, `CANCELLED`.

## Bookings

| Method | Endpoint | Auth | Mô tả |
| --- | --- | --- | --- |
| POST | `/bookings/lock` | Customer | Khóa ghế tạm thời |
| POST | `/bookings/release` | Customer | Hủy giữ ghế |
| POST | `/bookings/confirm` | Customer | Tạo order và ticket từ các ghế đang giữ |
| DELETE | `/bookings/tickets/:ticketId` | Customer | Hủy vé và tính hoàn tiền |

Payload khóa ghế:

```json
{ "tripId": "...", "seatIds": ["tripSeatId"] }
```

Payload xác nhận đặt vé:

```json
{
  "tripId": "...",
  "seatIds": ["tripSeatId"],
  "passengerInfo": [{ "name": "Nguyen Van A", "phone": "0900000000" }],
  "paymentMethod": "E_WALLET"
}
```

## Payments

| Method | Endpoint | Auth | Mô tả |
| --- | --- | --- | --- |
| POST | `/payments/initiate` | Customer | Tạo giao dịch thanh toán cho order |
| POST | `/payments/mock/complete` | Customer | Hoàn tất thanh toán mock trong môi trường local |
| POST | `/payments/callback` | Public webhook | Callback từ cổng thanh toán |
| GET | `/payments/order/:orderId` | Owner, Admin | Lịch sử thanh toán của order |

## Tickets

| Method | Endpoint | Auth | Mô tả |
| --- | --- | --- | --- |
| GET | `/tickets/:id` | Owner, Staff, Bus operator, Admin | Chi tiết vé |
| PATCH | `/tickets/:id/check-in` | Staff, Bus operator | Check-in khách lên xe |
| GET | `/tickets/trip/:tripId` | Staff, Bus operator | Vé đã thanh toán/hoàn tất của một chuyến |

## Reviews

| Method | Endpoint | Auth | Mô tả |
| --- | --- | --- | --- |
| POST | `/reviews` | Customer | Tạo đánh giá cho vé `COMPLETED` |
| GET | `/reviews/operator/:operatorId` | Public | Danh sách đánh giá đã duyệt của nhà xe |

## Operators

| Method | Endpoint | Auth | Mô tả |
| --- | --- | --- | --- |
| GET | `/operators` | Public | Danh sách nhà xe đã được duyệt |
| GET | `/operators/:id` | Public | Chi tiết nhà xe, tuyến và xe đang hoạt động |
| GET | `/operators/me/dashboard?period=day\|month\|year` | Bus operator | Thống kê nhà xe |
| PUT | `/operators/me` | Bus operator | Cập nhật thông tin nhà xe |

## Vehicles

| Method | Endpoint | Auth | Mô tả |
| --- | --- | --- | --- |
| GET | `/vehicles` | Bus operator | Danh sách xe của nhà xe hiện tại |
| POST | `/vehicles` | Bus operator | Tạo xe |
| PUT | `/vehicles/:id` | Bus operator | Cập nhật xe thuộc nhà xe hiện tại |
| DELETE | `/vehicles/:id` | Bus operator | Soft-delete xe bằng `isActive = false` |

## Routes

| Method | Endpoint | Auth | Mô tả |
| --- | --- | --- | --- |
| GET | `/routes?origin=&destination=` | Public | Danh sách tuyến đang hoạt động |
| POST | `/routes` | Bus operator | Tạo tuyến cho nhà xe hiện tại |
| PUT | `/routes/:id` | Bus operator | Cập nhật tuyến thuộc nhà xe hiện tại |
| DELETE | `/routes/:id` | Bus operator, Admin | Soft-delete tuyến bằng `isActive = false` |

## Staff

| Method | Endpoint | Auth | Mô tả |
| --- | --- | --- | --- |
| GET | `/staff/trips/assigned` | Staff | Chuyến được phân công |
| GET | `/staff/trips/:tripId/passengers` | Staff, Bus operator | Hành khách đã thanh toán/hoàn tất theo chuyến |

## Admin

| Method | Endpoint | Auth | Mô tả |
| --- | --- | --- | --- |
| GET | `/admin/stats` | Admin | Thống kê tổng quan |
| GET | `/admin/operators/pending` | Admin | Nhà xe chờ duyệt |
| PATCH | `/admin/operators/:id/approve` | Admin | Duyệt nhà xe |
| PATCH | `/admin/users/:id/toggle-active` | Admin | Khóa/mở khóa tài khoản |
| GET | `/admin/audit-logs?page=&limit=` | Admin | Nhật ký hoạt động |
| GET | `/admin/reviews/pending` | Admin | Đánh giá chờ duyệt |
| PATCH | `/admin/reviews/:id/approve` | Admin | Duyệt đánh giá |

## WebSocket

Socket URL: `http://localhost:3000`

Client kết nối với token:

```js
io(socketUrl, { auth: { token } });
```

| Event emit | Payload | Mô tả |
| --- | --- | --- |
| `join:trip` | `tripId` | Theo dõi cập nhật ghế của chuyến |
| `leave:trip` | `tripId` | Rời phòng chuyến |

| Event listen | Payload | Mô tả |
| --- | --- | --- |
| `seats:updated` | `{ tripId, seatIds, status }` | Cập nhật trạng thái ghế realtime |
