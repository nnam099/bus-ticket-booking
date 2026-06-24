# BusGo - Production-Ready Bus Ticket Booking System

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)
![React](https://img.shields.io/badge/React-18.x-blue.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)
![Redis](https://img.shields.io/badge/Redis-7-red.svg)

Hệ thống đặt vé xe khách theo tiêu chuẩn **Production-Ready**, bao gồm backend Express/Prisma, frontend React/Vite, cơ sở dữ liệu PostgreSQL và Redis để quản lý luồng đặt vé theo thời gian thực (Realtime Seat Locking). Dự án được thiết kế để chịu tải cao, với kiến trúc xử lý concurrency triệt để.

---

## 🚀 Tính năng kỹ thuật nổi bật (Production-Grade)

Dự án này không chỉ dừng lại ở mức đồ án cơ bản mà đã được kiện toàn để sẵn sàng chịu tải thực tế với các kỹ thuật chuyên sâu:

- **Bảo mật & Anti-Spam (Security):** Tích hợp Rate Limiting để chống tấn công Brute-force mật khẩu, chống spam mã OTP và chống DDOS API đặt vé. Chống lỗi Mass Assignment và IDOR (kiểm tra chặt chẽ quyền sở hữu dữ liệu).
- **Idempotency & Race-Condition Safe:** Ngăn chặn tuyệt đối lỗi "click đúp" trừ tiền nhiều lần bằng Redis Lock. Xử lý triệt để bài toán đồng thời (Concurrency) khi nhiều khách cùng chọn 1 ghế.
- **Refund Manager & Transaction Safety:** Quản lý giao dịch và hoàn tiền tự động/thủ công qua Gateway. Xử lý logic chống thất thoát dữ liệu thanh toán khi giao dịch trùng khớp lúc vé vừa hết hạn.
- **Đồng bộ Realtime (Socket.io):** Hiển thị trạng thái ghế ngay lập tức trên tất cả các thiết bị. Khóa ghế bằng đếm ngược (Countdown Timer) tích hợp chặt chẽ giữa Frontend và Backend.
- **Tối ưu cơ sở dữ liệu (Database Optimization):** Hệ thống có khả năng tìm kiếm cực nhanh trên khối lượng dữ liệu khổng lồ (seed trước hàng triệu ghế / hàng chục tuyến đường) nhờ hệ thống Database Indexing được thiết kế tối ưu cho luồng tìm kiếm.
- **Dọn dẹp tự động (Cron Job):** Hệ thống background worker liên tục rà soát và tự động giải phóng các ghế giữ chỗ quá 15 phút, ngăn chặn tận gốc lỗi "vé ma" (Ghost tickets).

## 🚍 Phân quyền & Chức năng

Hệ thống phục vụ 4 nhóm người dùng với phân quyền (RBAC) rõ ràng:

| Vai trò | Chức năng |
| --- | --- |
| **Khách hàng** | Tìm chuyến, chọn ghế realtime, đặt vé, thanh toán, xem/hủy vé, nhận hoàn tiền, đánh giá chuyến đi. |
| **Nhà xe** | Quản lý tuyến, xe, chuyến đi, giá vé và doanh thu thống kê. |
| **Tài xế/Phụ xe** | Xem chuyến được phân công, danh sách hành khách, check-in vé bằng QR Code. |
| **Admin** | Quản lý tài khoản, duyệt nhà xe, Audit Log (nhật ký hệ thống), duyệt đánh giá, quản lý Hoàn tiền (Refund Manager). |

## 🛠 Công nghệ sử dụng

**Backend:**
- Node.js, Express.js
- PostgreSQL, Prisma ORM
- Redis (Caching & Distributed Locks)
- Socket.IO (WebSockets)
- JWT Bearer Auth

**Frontend:**
- React 18, Vite
- Redux Toolkit
- React Router
- Tailwind CSS (Premium UI Design)
- Axios, Socket.IO Client

**DevOps & Deployment:**
- Docker & Docker Compose
- GitHub Actions (CI/CD)

## 🐳 Khởi động nhanh bằng Docker

Chạy toàn bộ hệ thống (Database, Redis, Backend, Frontend) chỉ với 1 câu lệnh:

```bash
docker-compose up --build
```

Sau khi các container khởi động hoàn tất:
- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:3000`

## 💻 Chạy thủ công (Local Development)

### 1. Cài đặt Backend
```bash
cd backend
npm install
# Khởi tạo DB Schema
npm run db:migrate   # Hoặc npx prisma db push
# Seed dữ liệu (Cấu hình trước tuyến đường, xe, người dùng)
npm run db:seed
# Chạy script bổ sung tự động tạo chuyến cho TẤT CẢ các tuyến
node prisma/seed-all-routes-trips.js
# Chạy Backend
npm run dev
```

### 2. Cài đặt Frontend
```bash
cd frontend
npm install
npm run dev
```

*Lưu ý: Cần tạo file `.env` (có thể copy từ `.env.example`) tại thư mục `backend` chứa biến môi trường Database (PostgreSQL) và Redis.*

## 🔑 Tài khoản Demo

Hệ thống cung cấp sẵn các tài khoản sau để test:

| Vai trò | Email | Mật khẩu |
| --- | --- | --- |
| Admin | `admin@busticket.vn` | `Admin@123` |
| Nhà xe | `operator@demo.vn` | `Demo@123` |
| Khách hàng | `customer@demo.vn` | `Demo@123` |
| Tài xế | `driver@demo.vn` | `Demo@123` |

*(Có thể tìm thấy thêm các nhà xe khác như `operator.coastal@demo.vn`, `operator.mekong@demo.vn` trong file `backend/prisma/seed.js`)*

## 🔄 Luồng Đặt vé Tiêu chuẩn

1. Khách hàng tìm chuyến qua `/api/trips/search`.
2. Trải nghiệm chọn ghế theo thời gian thực tại `/api/trips/:id`.
3. Hệ thống khóa ghế qua `/api/bookings/lock` (Sử dụng Redis Distributed Lock).
4. Khách hàng nhập thông tin và xác nhận `/api/bookings/confirm`.
5. Thanh toán được khởi tạo qua `/api/payments/initiate` (Tích hợp mock payment hoặc cổng thật).
6. Gateway trả kết quả về Webhook hoặc Callback URL.
7. Thanh toán thành công, ghế chính thức thuộc về khách hàng, vé QR được sinh ra.

## 📂 Cấu trúc dự án

```text
bus-ticket-booking/
├── backend/
│   ├── prisma/             # Schema DB, Migrations, Seed scripts
│   ├── src/
│   │   ├── controllers/    # Xử lý logic Request/Response
│   │   ├── middlewares/    # Auth, Rate Limiter, Error Handler
│   │   ├── routes/         # Định nghĩa API
│   │   ├── services/       # Core Business Logic (Booking, Payment...)
│   │   ├── utils/          # Security, Encryption, Helpers
│   │   └── server.js       # Entry point
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/     # UI Component dùng chung (SeatMap, Timer...)
│   │   ├── pages/          # Các trang (Booking, Payment, Admin...)
│   │   ├── store/          # Redux State Management
│   │   └── App.jsx         # Routing
│   └── Dockerfile
├── docs/                   # Tài liệu thiết kế (ERD, API Specs...)
├── docker-compose.yml      # Orchestration
└── README.md
```

## 📖 Tài liệu kỹ thuật chi tiết

- [Yêu cầu hệ thống](docs/requirements.md)
- [Thiết kế database](docs/database.md)
- [Sơ đồ và luồng hệ thống](docs/diagram.md)
- [API reference](docs/api.md)

---
*Developed with modern web practices.*
