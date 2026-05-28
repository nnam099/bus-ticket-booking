const crypto = require('crypto');

const activeTicketStatuses = ['PENDING', 'PAID', 'CHECKED_IN'];
const otpPurposes = ['REGISTER', 'RESET_PASSWORD', 'DELETE_ACCOUNT', 'PAYMENT'];

const getSecret = (name, fallbackName) => {
  const value = process.env[name] || (fallbackName ? process.env[fallbackName] : null);
  if (value) return value;
  if (process.env.NODE_ENV === 'test') return `test-${name.toLowerCase()}`;
  throw new Error(`${name} is not configured.`);
};

const hmac = (value, secretName, fallbackName) => crypto
  .createHmac('sha256', getSecret(secretName, fallbackName))
  .update(String(value))
  .digest('hex');

const hashOtp = (userId, purpose, code) => hmac(`${userId}:${purpose}:${code}`, 'OTP_HMAC_SECRET', 'JWT_SECRET');

const timingSafeEqualString = (a, b) => {
  const left = Buffer.from(String(a || ''), 'utf8');
  const right = Buffer.from(String(b || ''), 'utf8');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
};

const createPublicCode = (prefix, id) => {
  const payload = crypto.createHash('sha256').update(String(id)).digest('base64url').slice(0, 10).toUpperCase();
  const signature = hmac(`${prefix}:${payload}`, 'LOOKUP_CODE_SECRET', 'JWT_SECRET').slice(0, 6).toUpperCase();
  return `${prefix}-${payload}.${signature}`;
};

const parsePublicCode = (value, prefix) => {
  const normalized = String(value || '').trim().toUpperCase();
  if (!normalized.startsWith(`${prefix}-`)) return null;
  const body = normalized.slice(prefix.length + 1);
  const [payload, signature] = body.split('.');
  if (!payload || !signature) return null;
  if (signature.length < 6 || signature.length > 20) return null;
  const expected = hmac(`${prefix}:${payload}`, 'LOOKUP_CODE_SECRET', 'JWT_SECRET').slice(0, signature.length).toUpperCase();
  if (!timingSafeEqualString(signature, expected)) return null;
  return payload;
};

const createQrPayload = ({ ticketId, ticketCode, tripId, seatId }) => {
  const token = Buffer.from(JSON.stringify({ ticketId, ticketCode, tripId, seatId }), 'utf8').toString('base64url');
  const signature = hmac(`QR:${token}`, 'QR_SIGNING_SECRET', 'JWT_SECRET').slice(0, 32);
  return `BT:${token}.${signature}`;
};

module.exports = {
  activeTicketStatuses,
  otpPurposes,
  createPublicCode,
  createQrPayload,
  hashOtp,
  parsePublicCode,
  timingSafeEqualString,
};
