# Thiết Kế Cơ Sở Dữ Liệu

## Sơ đồ ERD trực tuyến
🔗 https://dbdiagram.io/d/Diagram_VeXe-69c736fcfb2db18e3b243d68

---

## Các nhóm thực thể

### 1. Identity & Access Management
| Bảng | Mô tả |
|------|--------|
| `users` | Thông tin đăng nhập (email, phone, password_hash) |
| `roles` | Vai trò: CUSTOMER, BUS_OPERATOR, STAFF, ADMIN |
| `user_roles` | Bảng trung gian N-N: User ↔ Role |
| `otp_codes` | Mã OTP theo mục đích (REGISTER, RESET_PASSWORD...) |

**Quan hệ:** USERS - ROLES là N-N qua USER_ROLES. Kỹ thuật Sub-typing tách bảng đặc thù theo role.

### 2. Fleet & Route Management
| Bảng | Mô tả |
|------|--------|
| `bus_operators` | Thông tin nhà xe (1-1 với users) |
| `vehicle_types` | Loại xe: tên, số ghế |
| `seat_layouts` | Sơ đồ ghế chuẩn theo loại xe (tọa độ row/col) |
| `vehicles` | Xe vật lý (biển số, năm SX) — thuộc về nhà xe |
| `routes` | Tuyến đường (điểm đi, điểm đến) — thuộc về nhà xe |

**Thiết kế Template:** `vehicle_types` → `seat_layouts` định nghĩa layout chuẩn. `vehicles` chỉ cần tham chiếu `vehicle_type_id`.

### 3. Trip Operations
| Bảng | Mô tả |
|------|--------|
| `trips` | Chuyến xe (tuyến + xe + giờ khởi hành + giá) |
| `staffs` | Nhân viên/tài xế (1-1 với users) |
| `trip_staffs` | Phân công nhân sự N-N: Trip ↔ Staff |

### 4. Core Seat Inventory (Trái tim hệ thống)
| Bảng | Mô tả |
|------|--------|
| `trip_seats` | Trạng thái ghế theo chuyến: AVAILABLE / PROCESSING / BOOKED / UNAVAILABLE |

**Logic khóa ghế:**
- Khi khách chọn → Redis SET NX (atomic) + DB status = PROCESSING
- Hết 15 phút → Redis TTL expire → Job giải phóng DB về AVAILABLE
- Thanh toán thành công → status = BOOKED, xóa Redis lock

### 5. Transactions & Reviews
| Bảng | Mô tả |
|------|--------|
| `customers` | Thông tin khách hàng (1-1 với users) |
| `orders` | Đơn hàng tổng của khách |
| `payments` | Lịch sử giao dịch (nhiều lần thử thanh toán) |
| `ticket_details` | Vé chi tiết (1 vé = 1 ghế + 1 hành khách) |
| `reviews` | Đánh giá (chỉ tạo được khi có ticket_detail hợp lệ) |

---

## Ràng buộc quan trọng

### Chống Double-booking
```sql
-- UNIQUE constraint đảm bảo 1 ghế trên 1 chuyến chỉ có 1 vé
UNIQUE (trip_seat_id) ON ticket_details
```

### Chống Spam Review
```sql
-- 1-1 giữa ticket_detail và review
-- Chỉ khi có vé thật (status = COMPLETED) mới tạo được review
UNIQUE (ticket_detail_id) ON reviews
```

---

## Trạng thái ghế (Trip Seat Status)

```
AVAILABLE   — Còn trống, có thể đặt
PROCESSING  — Đang được khách hàng giữ (15 phút)
BOOKED      — Đã thanh toán thành công
UNAVAILABLE — Không sử dụng (ghế hỏng, dành riêng...)
```

## Trạng thái vé (Ticket Status)

```
PENDING   → PAID → COMPLETED
                  ↘ REFUNDED
          ↘ CANCELLED
```

---

## Index đề xuất

```sql
-- Tìm kiếm chuyến xe nhanh
CREATE INDEX idx_trips_departure ON trips(departure_time, status);
CREATE INDEX idx_routes_cities ON routes(origin_city, destination_city);

-- Tra cứu ghế theo chuyến
CREATE INDEX idx_trip_seats_trip ON trip_seats(trip_id, status);

-- Tra cứu vé theo khách hàng
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_ticket_order ON ticket_details(order_id);

-- Redis lock key pattern
-- seat_lock:{trip_id}:{trip_seat_id} → customer_id, TTL 15 phút
```
