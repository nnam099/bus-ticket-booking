const defaultOrigins = ['http://localhost', 'http://localhost:5173'];

const getAllowedOrigins = () => {
  const configured = (process.env.CLIENT_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const developmentOrigins = process.env.NODE_ENV === 'production' ? [] : defaultOrigins;

  return [...new Set([...configured, ...developmentOrigins])];
};

const corsOrigin = (origin, callback) => {
  if (!origin || getAllowedOrigins().includes(origin)) {
    return callback(null, true);
  }

  return callback(new Error('Not allowed by CORS'));
};

module.exports = { corsOrigin, getAllowedOrigins };
