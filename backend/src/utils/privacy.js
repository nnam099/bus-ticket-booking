const crypto = require('crypto');

const PREFIX = 'enc:v1:';

const getKey = () => {
  const secret = process.env.PII_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'test') return crypto.createHash('sha256').update('test-pii-key').digest();
    return null;
  }
  return crypto.createHash('sha256').update(secret).digest();
};

const encryptSensitiveValue = (value) => {
  if (value === undefined || value === null || value === '') return value;
  const raw = String(value);
  if (raw.startsWith(PREFIX)) return raw;
  const key = getKey();
  if (!key) return raw;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(raw, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${Buffer.concat([iv, tag, encrypted]).toString('base64url')}`;
};

const decryptSensitiveValue = (value) => {
  if (typeof value !== 'string' || !value.startsWith(PREFIX)) return value;
  const key = getKey();
  if (!key) return value;

  try {
    const packed = Buffer.from(value.slice(PREFIX.length), 'base64url');
    const iv = packed.subarray(0, 12);
    const tag = packed.subarray(12, 28);
    const encrypted = packed.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  } catch {
    return value;
  }
};

const decryptTicket = (ticket) => {
  if (!ticket) return ticket;
  return {
    ...ticket,
    passengerName: decryptSensitiveValue(ticket.passengerName),
    passengerPhone: decryptSensitiveValue(ticket.passengerPhone),
  };
};

const decryptTickets = (tickets) => (Array.isArray(tickets) ? tickets.map(decryptTicket) : tickets);

const decryptOrderTickets = (order) => {
  if (!order?.ticketDetails) return order;
  return { ...order, ticketDetails: decryptTickets(order.ticketDetails) };
};

module.exports = {
  decryptOrderTickets,
  decryptSensitiveValue,
  decryptTicket,
  decryptTickets,
  encryptSensitiveValue,
};
