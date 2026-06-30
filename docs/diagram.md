# Sơ Đồ Và Luồng Hệ Thống

ERD online: https://dbdiagram.io/d/Diagram_VeXe-69c736fcfb2db18e3b243d68

## Quan hệ chính

```text
users
  ├─ user_roles ─ roles
  ├─ customers ─ orders ─ payments
  │                  └─ ticket_details ─ reviews
  ├─ bus_operators ─ routes ─ trips ─ trip_seats ─ ticket_details
  │                  ├─ vehicles ─ vehicle_types ─ seat_layouts
  │                  └─ depots ─ parking_slots
  └─ staffs ─ trip_staffs ─ trips
     └─ staff_shifts / staff_leaves
```

## Kiến trúc runtime

```text
React/Vite SPA
  │
  ├─ REST API /api/*
  │
  ├─ Socket.IO seat updates
  │
Express Backend
  │
  ├─ Prisma ORM ─ PostgreSQL
  │
  └─ Redis seat locks
```

## Luồng tìm chuyến

```text
Khách nhập điểm đi, điểm đến, ngày
  │
  ▼
GET /api/trips/search
  │
  ├─ Lọc route.originCity/destinationCity
  ├─ Lọc departureTime trong ngày
  ├─ Lọc status SCHEDULED/BOARDING
  └─ Tính số ghế AVAILABLE bằng _count.tripSeats
  │
  ▼
Frontend hiển thị danh sách chuyến
```

## Luồng chọn ghế và đặt vé

```text
GET /api/trips/:id
  │
  ▼
Frontend hiển thị seat map từ tripSeats + seatLayout
  │
  ▼
POST /api/bookings/lock
  │
  ├─ Redis SET NX seat_lock:{tripId}:{tripSeatId}, TTL 15 phút
  ├─ DB: trip_seats.status = PROCESSING
  └─ Socket.IO: seats:updated
  │
  ▼
POST /api/bookings/confirm
  │
  ├─ Tạo order PENDING
  ├─ Tạo ticket_details PENDING
  └─ Giữ nguyên ghế PROCESSING chờ thanh toán
```

## Luồng thanh toán

```text
POST /api/payments/initiate
  │
  ├─ Tạo payment PENDING
  └─ Trả paymentUrl mock cho frontend
  │
  ▼
POST /api/payments/mock/complete
hoặc
POST /api/payments/callback
  │
  ├─ SUCCESS:
  │   ├─ order.status = PAID
  │   ├─ ticket_details.status = PAID
  │   ├─ trip_seats.status = BOOKED
  │   └─ Xóa Redis lock
  │
  └─ FAILED:
      ├─ order.status = CANCELLED
      ├─ Xóa ticket_details PENDING
      ├─ trip_seats.status = AVAILABLE
      └─ Xóa Redis lock
```

## Luồng hủy vé

```text
DELETE /api/bookings/tickets/:ticketId
  │
  ├─ Kiểm tra vé thuộc khách hàng hiện tại
  ├─ Tính thời gian trước khởi hành
  ├─ Tạo payment hoàn tiền nếu có
  ├─ ticket_details.status = CANCELLED hoặc REFUNDED
  └─ trip_seats.status = AVAILABLE
```

## Luồng vận hành chuyến

```text
Staff/Operator
  │
  ├─ GET /api/staff/trips/assigned
  ├─ GET /api/staff/trips/:tripId/passengers
  ├─ GET /api/tickets/trip/:tripId
  ├─ PATCH /api/tickets/:id/check-in
  └─ PATCH /api/trips/:id/status
```

## Luồng admin

```text
Admin
  │
  ├─ GET /api/admin/stats
  ├─ GET /api/admin/operators/pending
  ├─ PATCH /api/admin/operators/:id/approve
  ├─ PATCH /api/admin/users/:id/toggle-active
  ├─ GET /api/admin/audit-logs
  ├─ GET /api/admin/reviews/pending
  └─ PATCH /api/admin/reviews/:id/approve
```

## Luồng Quản lý Vận tải (TMS - Enterprise)

```text
Cron Job (Tự động)
  │
  ├─ Đọc bảng `schedules`
  ├─ Kiểm tra `schedule_exceptions`
  └─ Tự động tạo `trips` theo tần suất cron_rule

Operator
  │
  ├─ POST /api/dispatch/vehicles (Điều phối xe vào bến/chuyến)
  ├─ POST /api/incident/report (Báo cáo sự cố Trip Incident)
  └─ Màn hình Audit Page theo dõi Event Log
```
