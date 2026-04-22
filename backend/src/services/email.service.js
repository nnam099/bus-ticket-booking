const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendOtpEmail = async (to, code, purpose) => {
  const purposeLabels = {
    REGISTER: 'đăng ký tài khoản',
    RESET_PASSWORD: 'đặt lại mật khẩu',
    DELETE_ACCOUNT: 'xóa tài khoản',
    PAYMENT: 'xác nhận thanh toán',
  };

  const label = purposeLabels[purpose] || 'xác thực';

  await transporter.sendMail({
    from: `"Đặt Vé Xe Khách" <${process.env.EMAIL_FROM}>`,
    to,
    subject: `Mã OTP ${label} - BusTicket`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #e85d04;">🚌 BusTicket</h2>
        <p>Mã OTP để <strong>${label}</strong> của bạn là:</p>
        <div style="font-size: 36px; font-weight: bold; color: #e85d04; text-align: center; 
                    padding: 20px; background: #fff3e0; border-radius: 8px; letter-spacing: 8px;">
          ${code}
        </div>
        <p style="color: #666; margin-top: 16px;">Mã có hiệu lực trong <strong>5 phút</strong>.</p>
        <p style="color: #999; font-size: 12px;">Nếu bạn không yêu cầu mã này, hãy bỏ qua email này.</p>
      </div>
    `,
  }).catch((err) => logger.error('Failed to send OTP email:', err));
};

const sendTicketEmail = async (to, ticketData) => {
  await transporter.sendMail({
    from: `"Đặt Vé Xe Khách" <${process.env.EMAIL_FROM}>`,
    to,
    subject: `Xác nhận vé xe - ${ticketData.route} - BusTicket`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e85d04;">🎫 Vé xe của bạn</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td><strong>Tuyến:</strong></td><td>${ticketData.route}</td></tr>
          <tr><td><strong>Khởi hành:</strong></td><td>${ticketData.departureTime}</td></tr>
          <tr><td><strong>Ghế:</strong></td><td>${ticketData.seatCode}</td></tr>
          <tr><td><strong>Hành khách:</strong></td><td>${ticketData.passengerName}</td></tr>
          <tr><td><strong>Giá vé:</strong></td><td>${ticketData.price.toLocaleString('vi-VN')}đ</td></tr>
        </table>
        <img src="${ticketData.qrCode}" alt="QR Code" style="margin-top: 20px; width: 200px;" />
        <p style="color: #666; font-size: 12px; margin-top: 16px;">
          Vui lòng xuất trình mã QR này khi lên xe. Chúc bạn có chuyến đi vui vẻ!
        </p>
      </div>
    `,
  }).catch((err) => logger.error('Failed to send ticket email:', err));
};

module.exports = { sendOtpEmail, sendTicketEmail };
