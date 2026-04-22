# 🚌 Bus Ticket Booking System (Hệ thống Đặt Vé Xe Khách)

Nền tảng số hóa kết nối hành khách và đơn vị vận tải, hỗ trợ đặt vé trực tuyến, quản lý chuyến xe, thanh toán và vận hành thời gian thực.

## 📋 Tổng quan hệ thống

Hệ thống phục vụ **4 nhóm đối tượng** chính:

| Actor | Mô tả |
|-------|--------|
| **Khách hàng** | Tìm kiếm, đặt vé, thanh toán, quản lý lịch sử đi lại |
| **Nhà xe** | Quản lý xe, tuyến đường, lịch trình, giá vé, doanh thu |
| **Nhân viên / Tài xế** | Soát vé, xác nhận hành khách, cập nhật trạng thái chuyến |
| **Admin** | Phê duyệt nhà xe, cấu hình hệ thống, audit log |

## 🛠️ Công nghệ sử dụng

### Backend
- **Runtime:** Node.js + Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** JWT + OTP (SMS/Email)
- **Cache / Lock:** Redis (Booking Lock)
- **Realtime:** Socket.IO
- **Payment:** VNPay / MoMo

### Frontend
- **Framework:** React.js (Vite)
- **State:** Redux Toolkit
- **UI:** Tailwind CSS + shadcn/ui
- **HTTP:** Axios
- **Realtime:** Socket.IO Client

### DevOps
- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions

## 🚀 Chạy nhanh với Docker

```bash
git clone <repo-url>
cd bus-ticket-booking
cp .env.example .env
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Docs: http://localhost:3000/api/docs

## 📁 Cấu trúc dự án

```
bus-ticket-booking/
├── backend/               # Node.js + Express API
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── models/        # Prisma models
│   │   ├── routes/        # API routes
│   │   ├── middlewares/   # Auth, validation, error handling
│   │   ├── services/      # Business logic
│   │   └── utils/         # Helpers
│   ├── prisma/            # DB schema & migrations
│   └── tests/
├── frontend/              # React.js app
│   └── src/
│       ├── components/    # Reusable UI components
│       ├── pages/         # Route-based pages
│       ├── services/      # API calls
│       └── store/         # Redux store
├── docs/                  # Tài liệu yêu cầu & thiết kế
├── docker-compose.yml
└── .github/workflows/     # CI/CD pipelines
```

## 📐 Quy tắc nghiệp vụ chính

### Đặt vé & Giữ chỗ
- Ghế được **khóa 15 phút** khi khách chọn (QD_BOOK_01)
- Tự động **giải phóng ghế** nếu không thanh toán (QD_BOOK_02)
- Mỗi tài khoản tối đa **5 ghế / chuyến** (QD_BOOK_03)

### Vòng đời vé
```
Pending → Paid → Completed
                ↘ Refunded (nếu đủ điều kiện)
         ↘ Cancelled
```

### Hủy vé & Hoàn tiền
- > 24h trước khởi hành: **Hoàn 100%**
- 12–24h trước khởi hành: **Hoàn 70%** (phí 30%)
- Nhà xe hủy chuyến: **Hoàn 100% tự động**

## 🔑 Tài khoản mặc định (Development)

| Vai trò | Email | Mật khẩu |
|---------|-------|----------|
| Admin | admin@busticket.vn | Admin@123 |
| Nhà xe demo | operator@demo.vn | Demo@123 |
| Khách hàng | customer@demo.vn | Demo@123 |

## 📄 Tài liệu

- [Yêu cầu hệ thống](docs/requirements.md)
- [Thiết kế database](docs/database.md)
- [Sơ đồ ERD](docs/diagram.md)
- [API Reference](docs/api.md)

## 🤝 Đóng góp

1. Fork repository
2. Tạo branch: `git checkout -b feature/ten-tinh-nang`
3. Commit: `git commit -m 'feat: mô tả thay đổi'`
4. Push: `git push origin feature/ten-tinh-nang`
5. Tạo Pull Request

## 📜 License

MIT License
