// Dashboard.jsx
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
export default function CustomerDashboard() {
  const { user } = useSelector(s => s.auth);
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        Xin chào, {user?.customer?.fullName || 'Khách hàng'} 👋
      </h1>
      <p className="text-gray-500 mb-8">Quản lý vé và thông tin cá nhân của bạn</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { to: '/', icon: '🔍', title: 'Tìm chuyến xe', desc: 'Tìm và đặt vé cho chuyến đi tiếp theo' },
          { to: '/my-tickets', icon: '🎫', title: 'Vé của tôi', desc: 'Xem và quản lý các vé đã đặt' },
          { to: '/profile', icon: '👤', title: 'Hồ sơ cá nhân', desc: 'Cập nhật thông tin tài khoản' },
        ].map(item => (
          <Link key={item.to} to={item.to} className="card hover:shadow-md transition-shadow">
            <div className="text-3xl mb-2">{item.icon}</div>
            <h3 className="font-semibold text-gray-800">{item.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
