# Bus Ticket Booking System

Hệ thống đặt vé xe khách gồm backend Express/Prisma, frontend React/Vite, PostgreSQL và Redis để giữ ghế tạm thời theo thời gian thực.

## Chức năng chính

Hệ thống phục vụ 4 nhóm người dùng:

| Vai trò | Chức năng |
| --- | --- |
| Khách hàng | Tìm chuyến, chọn ghế, đặt vé, thanh toán, xem/hủy vé, đánh giá chuyến đi |
| Nhà xe | Quản lý tuyến, xe, chuyến đi, giá vé và doanh thu |
| Nhân viên/Tài xế | Xem chuyến được phân công, danh sách hành khách, check-in vé |
| Admin | Duyệt nhà xe, khóa/mở tài khoản, xem thống kê, audit log, duyệt đánh giá |

## Công nghệ

Backend:

- Node.js, Express.js
- PostgreSQL, Prisma
- JWT Bearer auth, RBAC
- Redis cho khóa ghế tạm thời
- Socket.IO cho cập nhật ghế realtime

Frontend:

- React 18, Vite
- Redux Toolkit
- React Router
- Tailwind CSS
- Axios, Socket.IO Client

DevOps:

- Docker Compose
- GitHub Actions

## Chạy bằng Docker

```bash
docker-compose up --build
```

Sau khi các container chạy xong:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`
- Health check: `http://localhost:3000/health`
- API docs nếu có swagger: `http://localhost:3000/api/docs`

Seed dữ liệu demo:

```bash
docker exec bus_ticket_api npm run db:seed
```

Seed hiện tạo:

- Tài khoản admin, khách hàng, nhà xe, tài xế
- 2 loại xe: limousine 22 chỗ, giường nằm 40 chỗ
- Sơ đồ ghế cho từng loại xe
- Xe vật lý, tuyến xe và chuyến xe trong 14 ngày tới
- Ghế theo từng chuyến để có thể tìm chuyến, chọn ghế và đặt vé ngay

## Chạy local

Backend:

```bash
cd backend
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Nếu chạy frontend local không qua Docker, cấu hình API:

```bash
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

## Tài khoản demo

| Vai trò | Email | Mật khẩu |
| --- | --- | --- |
| Admin | `admin@busticket.vn` | `Admin@123` |
| Nhà xe | `operator@demo.vn` | `Demo@123` |
| Khách hàng | `customer@demo.vn` | `Demo@123` |
| Tài xế | `driver@demo.vn` | `Demo@123` |

## Dữ liệu lịch xe demo

Seed tạo các tuyến mẫu:

| Tuyến | Giờ chạy hằng ngày | Giá cơ bản |
| --- | --- | --- |
| TP. Hồ Chí Minh -> Đà Lạt | 06:00, 09:00, 13:00, 22:00 | 280.000đ |
| TP. Hồ Chí Minh -> Nha Trang | 07:00, 20:00, 22:30 | 320.000đ |
| TP. Hồ Chí Minh -> Cần Thơ | 05:30, 08:30, 14:00, 18:00 | 180.000đ |
| Hà Nội -> Hải Phòng | 06:30, 10:00, 15:00, 19:00 | 150.000đ |
| Đà Nẵng -> Huế | 07:00, 11:00, 16:00 | 140.000đ |

Các chuyến được tạo cho 14 ngày tiếp theo tính từ lúc chạy seed.

## Luồng đặt vé

1. Khách hàng tìm chuyến qua `/api/trips/search`.
2. Xem chi tiết chuyến và sơ đồ ghế qua `/api/trips/:id`.
3. Khóa ghế qua `/api/bookings/lock`. Ghế chuyển sang `PROCESSING` trong 15 phút.
4. Xác nhận đặt vé qua `/api/bookings/confirm`, tạo order và ticket ở trạng thái `PENDING`.
5. Khởi tạo thanh toán qua `/api/payments/initiate`.
6. Hoàn tất mock payment qua `/api/payments/mock/complete` hoặc gateway callback `/api/payments/callback`.
7. Thanh toán thành công chuyển order/ticket sang `PAID`, ghế sang `BOOKED`.

## Cấu trúc dự án

```text
bus-ticket-booking/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middlewares/
│       ├── routes/
│       ├── services/
│       └── utils/
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       └── store/
├── docs/
├── docker-compose.yml
└── README.md
```

## Tài liệu

- [Yêu cầu hệ thống](docs/requirements.md)
- [Thiết kế database](docs/database.md)
- [Sơ đồ và luồng hệ thống](docs/diagram.md)
- [API reference](docs/api.md)
