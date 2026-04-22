# Sơ Đồ Hệ Thống

## ERD Online
🔗 https://dbdiagram.io/d/Diagram_VeXe-69c736fcfb2db18e3b243d68

---

## Mối Quan Hệ Giữa Các Thực Thể

### 1. Phân quyền & Định danh (Identity & Access Management)
- **USERS ↔ ROLES (N-N qua USER_ROLES):** Một người dùng có thể đảm nhận nhiều vai trò.
- **USERS → CUSTOMERS / BUS_OPERATORS / STAFFS (1-1):** Kỹ thuật Sub-typing — USERS chỉ giữ thông tin đăng nhập, thông tin đặc thù tách riêng.

### 2. Phương tiện & Tuyến đường (Fleet & Route)
- **BUS_OPERATORS → VEHICLES / ROUTES (1-N):** Mỗi nhà xe quản lý nhiều xe và tuyến riêng.
- **VEHICLE_TYPES → SEAT_LAYOUTS / VEHICLES (1-N):** Template layout chuẩn cho từng loại xe.

### 3. Vận hành Chuyến đi (Trip Operations)
- **ROUTES → TRIPS (1-N):** Một tuyến có nhiều chuyến.
- **TRIPS ↔ STAFFS (N-N qua TRIP_STAFFS):** Phân công nhân sự nhiều-nhiều.

### 4. Quản lý Ghế (Core Seat Inventory)
- **TRIPS ↔ SEAT_LAYOUTS (N-N qua TRIP_SEATS):** Sinh ghế theo chuyến từ layout xe. TRIP_SEATS lưu trạng thái real-time.

### 5. Giao dịch & Đánh giá (Transactions & Reviews)
- **CUSTOMERS → ORDERS (1-N):** Khách hàng tạo đơn hàng.
- **ORDERS → PAYMENTS (1-N):** Một đơn cho phép thất bại và thử lại nhiều lần.
- **ORDERS → TICKET_DETAILS (1-N):** Một đơn hàng mua nhiều vé.
- **TICKET_DETAILS → TRIP_SEATS (1-1):** Bảo vệ double-booking tuyệt đối.
- **TICKET_DETAILS → REVIEWS (1-1):** Chỉ người có vé thật mới được đánh giá.

---

## Luồng Đặt Vé (Booking Flow)

```
Khách chọn ghế
      │
      ▼
Redis SET NX seat_lock:{tripId}:{seatId} → customerId (TTL 15 phút)
      │
      ├── Thành công → DB: trip_seats.status = PROCESSING
      │                    → Broadcast Socket: seats:updated { PROCESSING }
      │
      └── Thất bại (ghế đã lock) → Báo lỗi cho khách
              │
              ▼
      Khách điền thông tin + chọn thanh toán
              │
              ▼
      Gọi cổng thanh toán (VNPay/MoMo)
              │
              ├── Thanh toán thành công
              │       → Xóa Redis lock
              │       → DB: trip_seats.status = BOOKED
              │       → Tạo ticket_details + QR Code
              │       → Broadcast Socket: seats:updated { BOOKED }
              │
              └── Timeout 15 phút / Hủy
                      → Redis TTL expire
                      → DB: trip_seats.status = AVAILABLE
                      → Broadcast Socket: seats:updated { AVAILABLE }
```

---

## Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────┐
│                  CLIENT                          │
│  React SPA (Vite + Redux + Tailwind CSS)         │
│  Socket.IO Client (seat map real-time)           │
└────────────────────┬────────────────────────────┘
                     │ HTTPS / WSS
┌────────────────────▼────────────────────────────┐
│                 BACKEND                          │
│  Node.js + Express.js                            │
│  Socket.IO Server                                │
│  Prisma ORM                                      │
└──────┬─────────────────────────┬────────────────┘
       │                         │
┌──────▼──────┐          ┌───────▼──────┐
│ PostgreSQL  │          │    Redis     │
│  (Primary   │          │ (Seat Locks  │
│   Store)    │          │  Cache OTP)  │
└─────────────┘          └──────────────┘
```
