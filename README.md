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

## Đánh giá so với đề bài/source

Source yêu cầu chính nằm trong thư mục `source/`, tập trung vào website đặt vé xe khách, không mở rộng thành hệ thống điều phối vận tải chuyên sâu.

Kết luận hiện tại: project bám đúng phạm vi chính của đề bài. Các chức năng cốt lõi đã có gồm đăng ký/đăng nhập, phân quyền theo vai trò, tìm chuyến, xem ghế realtime, giữ ghế 15 phút, đặt vé, thanh toán mock/callback, quản lý vé, hủy vé và hoàn tiền, đánh giá sau chuyến, nhà xe quản lý tuyến/xe/chuyến/doanh thu, nhân viên/tài xế xem chuyến được phân công và check-in vé, admin duyệt nhà xe/quản lý tài khoản/audit/duyệt đánh giá.

Các phần đã được giữ trong phạm vi:

- Không có GPS realtime, điều phối ca, quản lý bảo dưỡng, nhiên liệu hoặc chi phí vận hành xe.
- Không có hệ thống chăm sóc khách hàng/ticket nâng cao, kế toán hoặc hóa đơn điện tử.
- Không cho xóa cứng dữ liệu quan trọng; tuyến, xe và tài khoản dùng hướng soft-delete/anonymize.
- Trạng thái chuyến dùng đúng luồng cơ bản: `SCHEDULED`, `BOARDING`, `DEPARTED`, `DELAYED`, `CANCELLED`, `COMPLETED`.
- Trạng thái vé sau kiểm vé chuyển sang `CHECKED_IN`, đúng nghiệp vụ tài xế/phụ xe xác nhận khách lên xe.

Các điểm đang giản lược so với mô tả đầy đủ trong source:

- Điểm đón/trả hiện lưu theo tuyến chính, chưa tách bảng nhiều điểm đón/trả cho từng chuyến.
- Chưa có màn hình quản lý loại xe/sơ đồ ghế động; dữ liệu loại xe và sơ đồ ghế chủ yếu được seed.
- Chưa có chức năng nhân viên đặt vé hộ, đổi vé hoặc xác nhận thanh toán thủ công chi tiết.
- Chưa có cấu hình hệ thống/backup/restore trên giao diện admin; chỉ giữ các phần quản trị cần cho đồ án đặt vé.

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
