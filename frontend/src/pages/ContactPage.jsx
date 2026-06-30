import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20 font-nunito transition-colors duration-300">
      {/* Dynamic Header */}
      <div className="bg-slate-900 pt-24 pb-48 relative overflow-hidden">
        {/* Animated Orbs */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-[#e85d04]/30 rounded-full blur-[80px] animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
        
        <div className="max-w-6xl mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight drop-shadow-lg">
            Kết nối với <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e85d04] to-[#ffba08]">BusGo</span>
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto font-medium">
            Dù bạn có câu hỏi, đề xuất hay cần hỗ trợ kỹ thuật, chúng tôi luôn ở đây lắng nghe và sẵn sàng giải quyết.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-32 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* Left Column: Contact Info Cards */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-gradient-to-br from-[#e85d04] to-[#dc2f02] rounded-3xl p-8 text-white shadow-2xl shadow-orange-900/20 relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 text-white/10 group-hover:scale-110 transition-transform duration-500">
                <Phone className="w-48 h-48" />
              </div>
              <h2 className="text-2xl font-black mb-2 relative z-10">Đường dây nóng</h2>
              <p className="text-orange-100 mb-6 relative z-10 font-medium">Hỗ trợ khẩn cấp 24/7</p>
              <a href="tel:18001234" className="inline-block text-4xl font-black mb-1 relative z-10 hover:text-orange-200 transition-colors">1800 1234</a>
              <p className="text-sm font-semibold text-orange-200 uppercase tracking-widest relative z-10">Miễn phí cước gọi</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-slate-700 flex-1">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">Thông tin khác</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-slate-700 text-blue-500 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Email hỗ trợ</p>
                    <a href="mailto:hello@busgovietnam.vn" className="text-base font-bold text-gray-800 dark:text-gray-100 hover:text-[#e85d04] transition-colors">hello@busgovietnam.vn</a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-slate-700 text-green-500 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Giờ làm việc</p>
                    <p className="text-base font-bold text-gray-800 dark:text-gray-100">7:00 – 22:00 <span className="text-sm font-normal text-gray-500">(Tất cả các ngày)</span></p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-slate-700 text-purple-500 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Văn phòng đại diện</p>
                    <p className="text-base font-bold text-gray-800 dark:text-gray-100 leading-relaxed">
                      123 Lê Lợi, Phường Bến Nghé,<br/>Quận 1, TP. Hồ Chí Minh
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Glassmorphism Form */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 md:p-10 shadow-2xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-slate-700 h-full">
              {sent ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 animate-in fade-in zoom-in duration-500">
                  <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                  </div>
                  <h3 className="text-3xl font-black text-gray-800 dark:text-gray-100 mb-4">Gửi thành công!</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-lg max-w-md mb-8">
                    Cảm ơn bạn đã liên hệ. Đội ngũ BusGo sẽ phản hồi bạn qua email trong thời gian sớm nhất (tối đa 24h).
                  </p>
                  <button 
                    onClick={() => setSent(false)} 
                    className="px-8 py-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors"
                  >
                    Gửi yêu cầu khác
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-8 border-b border-gray-100 dark:border-slate-700 pb-6">
                    <h2 className="text-2xl font-black text-gray-800 dark:text-gray-100">Gửi thư cho chúng tôi</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Điền đầy đủ thông tin bên dưới, chúng tôi sẽ xử lý ngay lập tức.</p>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Họ và tên <span className="text-red-500">*</span></label>
                        <input 
                          className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-5 py-3.5 focus:ring-2 focus:ring-[#e85d04] focus:border-transparent outline-none transition-all font-medium text-gray-800 dark:text-gray-100" 
                          placeholder="Nguyễn Văn A" 
                          required 
                          value={form.name}
                          onChange={e => setForm({ ...form, name: e.target.value })} 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Số điện thoại</label>
                        <input 
                          className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-5 py-3.5 focus:ring-2 focus:ring-[#e85d04] focus:border-transparent outline-none transition-all font-medium text-gray-800 dark:text-gray-100" 
                          placeholder="0901 234 567" 
                          value={form.phone}
                          onChange={e => setForm({ ...form, phone: e.target.value })} 
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Email phản hồi <span className="text-red-500">*</span></label>
                      <input 
                        type="email"
                        className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-5 py-3.5 focus:ring-2 focus:ring-[#e85d04] focus:border-transparent outline-none transition-all font-medium text-gray-800 dark:text-gray-100" 
                        placeholder="email@example.com" 
                        required 
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Chủ đề cần hỗ trợ</label>
                      <select 
                        className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-5 py-3.5 focus:ring-2 focus:ring-[#e85d04] focus:border-transparent outline-none transition-all font-medium text-gray-800 dark:text-gray-100 appearance-none cursor-pointer" 
                        value={form.subject} 
                        onChange={e => setForm({ ...form, subject: e.target.value })}
                      >
                        <option value="">-- Chọn vấn đề của bạn --</option>
                        <option>Hỏi về đặt vé</option>
                        <option>Hủy / Đổi vé</option>
                        <option>Hoàn tiền giao dịch</option>
                        <option>Khiếu nại nhà xe / tài xế</option>
                        <option>Lỗi ứng dụng / website</option>
                        <option>Hợp tác doanh nghiệp</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Nội dung chi tiết <span className="text-red-500">*</span></label>
                      <textarea 
                        className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-5 py-3.5 focus:ring-2 focus:ring-[#e85d04] focus:border-transparent outline-none transition-all font-medium text-gray-800 dark:text-gray-100 resize-none" 
                        rows={5} 
                        placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải để chúng tôi hỗ trợ tốt nhất..." 
                        required 
                        value={form.message}
                        onChange={e => setForm({ ...form, message: e.target.value })} 
                      />
                    </div>
                    
                    <button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-[#e85d04] to-[#dc2f02] hover:shadow-lg hover:shadow-orange-500/30 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all hover:-translate-y-1 active:translate-y-0"
                    >
                      <Send className="w-5 h-5" /> Gửi yêu cầu ngay
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
