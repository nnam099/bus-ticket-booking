const REQUIRED_IN_PRODUCTION = [
  'DATABASE_URL',
  'JWT_SECRET',
  'REDIS_URL',
  'PAYMENT_WEBHOOK_SECRET',
  'OTP_HMAC_SECRET',
  'LOOKUP_CODE_SECRET',
  'QR_SIGNING_SECRET',
  'PII_ENCRYPTION_KEY',
];

const FORBIDDEN_DEFAULTS = new Set([
  'postgres123',
  'your_jwt_secret_change_in_production',
  'change_me',
  'changeme',
]);

const validateRuntimeEnv = () => {
  if (process.env.NODE_ENV !== 'production') return;

  const missing = REQUIRED_IN_PRODUCTION.filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }

  const weak = REQUIRED_IN_PRODUCTION.filter((name) => FORBIDDEN_DEFAULTS.has(process.env[name]));
  if (weak.length) {
    throw new Error(`Unsafe default secrets are not allowed in production: ${weak.join(', ')}`);
  }
};

module.exports = { validateRuntimeEnv };
