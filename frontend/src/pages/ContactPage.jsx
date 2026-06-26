import { useState } from 'react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Giả lập gửi thành công
    setSent(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto mb-4">
          <i className="ti ti-mail text-[#e85d04]" style={{ fontSize: 32 }} />
        </div>
        <h1 className="text-3xl font-black text-gray-800 dark:text-gray-100">Liên hệ chúng tôi</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Chúng tôi luôn sẵn sàng hỗ trợ bạn</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact info */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Thông tin liên hệ</h2>
          {[
            { icon: 'ti-phone', label: 'Hotline (miễn phí)', val: '1800 1234', href: 'tel:18001234', accent: true },
            { icon: 'ti-mail', label: 'Email hỗ trợ', val: 'hello@busgovietnam.vn', href: 'mailto:hello@busgovietnam.vn' },
            { icon: 'ti-clock', label: 'Giờ làm việc', val: '7:00 – 22:00 (mỗi ngày)' },
            { icon: 'ti-map-pin', label: 'Địa chỉ', val: '123 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM' },
          ].map(({ icon, label, val, href, accent }) => (
            <div key={label} className="flex gap-4 items-start p-4 rounded-2xl bg-gray-50 dark:bg-slate-800">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                <i className={`ti ${icon} text-[#e85d04]`} style={{ fontSize: 20 }} />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                {href ? (
                  <a href={href} className={`font-bold hover:underline ${accent ? 'text-xl text-[#e85d04]' : 'text-gray-800 dark:text-gray-100'}`}>{val}</a>
                ) : (
                  <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm mt-0.5">{val}</p>
                )}
              </div>
            </div>
          ))}

          <div className="p-4 rounded-2xl bg-orange-50 dark:bg-slate-800 border border-orange-200 dark:border-slate-700">
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-1">💬 Phản hồi nhanh nhất</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Gọi hotline <strong className="text-[#e85d04]">1800 1234</strong> — miễn phí, phục vụ 7:00–22:00 mỗi ngày để được hỗ trợ ngay lập tức.</p>
          </div>
        </div>

        {/* Form */}
        <div className="card">
          {sent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                <i className="ti ti-check text-green-600" style={{ fontSize: 32 }} />
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Đã gửi thành công!</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Chúng tôi sẽ phản hồi bạn trong vòng 24 giờ làm việc.</p>
              <button onClick={() => setSent(false)} className="mt-5 btn-outline px-6 py-2 text-sm">Gửi tin nhắn khác</button>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-5">Gửi tin nhắn</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Họ tên *</label>
                    <input className="input" placeholder="Nguyễn Văn A" required value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Số điện thoại</label>
                    <input className="input" placeholder="0901234567" value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input className="input" type="email" placeholder="email@example.com" required value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label className="label">Chủ đề</label>
                  <select className="input" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}>
                    <option value="">Chọn chủ đề...</option>
                    <option>Hỏi về đặt vé</option>
                    <option>Hủy / Đổi vé</option>
                    <option>Hoàn tiền</option>
                    <option>Khiếu nại nhà xe</option>
                    <option>Vấn đề kỹ thuật</option>
                    <option>Khác</option>
                  </select>
                </div>
                <div>
                  <label className="label">Nội dung *</label>
                  <textarea className="input" rows={4} placeholder="Mô tả vấn đề của bạn..." required value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })} />
                </div>
                <button type="submit" className="btn-primary w-full py-3">Gửi tin nhắn</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
