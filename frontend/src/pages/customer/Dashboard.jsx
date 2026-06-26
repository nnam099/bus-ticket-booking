// Dashboard.jsx
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

const icons = {
  search: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  ticket: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>,
  invoice: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14h6m-6 4h6m2 4H7a2 2 0 01-2-2V4a1 1 0 011.447-.894L8 4l2-1 2 1 2-1 2 1 1.553-.894A1 1 0 0119 4v16a2 2 0 01-2 2z" /></svg>,
  profile: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
};

export default function CustomerDashboard() {
  const { user } = useSelector(s => s.auth);
  
  return (
    <div className="w-full">
      {/* Welcome Hero Card */}
      <div className="mb-12 bg-white/80 backdrop-blur-md rounded-3xl p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-brand/10 to-transparent rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-transform duration-700 group-hover:scale-110"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-500/5 to-transparent rounded-full blur-2xl -ml-20 -mb-20 pointer-events-none"></div>
        
        <div className="w-24 h-24 shrink-0 rounded-full bg-gradient-to-tr from-brand to-orange-400 p-1 shadow-lg shadow-brand/20 relative z-10">
          <div className="w-full h-full bg-white rounded-full border-4 border-white flex items-center justify-center overflow-hidden">
             {user?.customer?.avatarUrl ? (
               <img src={user.customer.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
             ) : (
               <svg className="w-10 h-10 text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
             )}
          </div>
        </div>
        
        <div className="z-10 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-black text-gray-800 mb-2 tracking-tight">
            Chào mừng trở lại, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-orange-500">{user?.customer?.fullName || 'Khách hàng'}</span>!
          </h1>
          <p className="text-gray-500 text-lg font-medium">Bạn đã sẵn sàng cho chuyến đi tiếp theo chưa?</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black text-gray-800 tracking-tight">Truy cập nhanh</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { to: '/', icon: icons.search, title: 'Tìm chuyến xe', desc: 'Khám phá hơn 500+ tuyến đường khắp cả nước' },
          { to: '/my-tickets', icon: icons.ticket, title: 'Vé của tôi', desc: 'Xem lịch trình vé điện tử' },
          { to: '/my-invoices', icon: icons.invoice, title: 'Hóa đơn của tôi', desc: 'Theo dõi hóa đơn, giao dịch và danh sách vé đã mua' },
          { to: '/profile', icon: icons.profile, title: 'Hồ sơ cá nhân', desc: 'Quản lý thông tin và bảo mật tài khoản' },
        ].map(item => (
          <Link key={item.to} to={item.to} className="group relative bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 hover:border-brand/30 hover:shadow-[0_8px_30px_rgb(232,93,4,0.1)] transition-all duration-300 overflow-hidden text-left flex flex-col h-full hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-2xl -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-150"></div>
            <div className="w-14 h-14 rounded-2xl bg-orange-50 text-brand flex items-center justify-center mb-6 group-hover:bg-brand group-hover:text-white transition-colors duration-300 shadow-sm relative z-10">
              {item.icon}
            </div>
            <div className="relative z-10 mt-auto">
              <h3 className="font-bold text-gray-800 text-xl mb-2 group-hover:text-brand transition-colors">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
            {/* Arrow icon that appears on hover */}
            <div className="absolute bottom-6 right-6 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-brand">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
