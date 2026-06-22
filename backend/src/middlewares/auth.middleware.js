const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { redisClient } = require('../config/redis');
const logger = require('../utils/logger');

/** TTL (giây) cho cache thông tin user trong Redis */
const AUTH_CACHE_TTL = 60;

/**
 * Tạo Redis key cho user cache
 * @param {string} userId
 */
const userCacheKey = (userId) => `auth:user:${userId}`;

/**
 * Lấy thông tin user từ Redis cache.
 * Trả về null nếu cache miss hoặc Redis không khả dụng.
 * @param {string} userId
 */
const getUserFromCache = async (userId) => {
  try {
    const cached = await redisClient.get(userCacheKey(userId));
    if (cached) return JSON.parse(cached);
  } catch (err) {
    // Redis lỗi → fallthrough to DB, không crash server
    logger.warn(`Auth cache read failed for ${userId}: ${err.message}`);
  }
  return null;
};

/**
 * Lưu thông tin user vào Redis cache.
 * @param {string} userId
 * @param {object} user
 */
const setUserCache = async (userId, user) => {
  try {
    await redisClient.set(userCacheKey(userId), JSON.stringify(user), { EX: AUTH_CACHE_TTL });
  } catch (err) {
    logger.warn(`Auth cache write failed for ${userId}: ${err.message}`);
  }
};

/**
 * Xóa cache của một user (dùng khi admin khóa/mở khóa tài khoản).
 * @param {string} userId
 */
const invalidateUserCache = async (userId) => {
  try {
    await redisClient.del(userCacheKey(userId));
  } catch (err) {
    logger.warn(`Auth cache invalidation failed for ${userId}: ${err.message}`);
  }
};

/**
 * Middleware xác thực JWT với Redis cache.
 * Cache hit → không query DB.
 * Cache miss → query DB, lưu cache 60 giây.
 */
const authenticate = async (req, res, next) => {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để tiếp tục.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // --- Cache lookup ---
    let user = await getUserFromCache(decoded.userId);

    if (!user) {
      // Cache miss: query DB rồi cache lại
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          userRoles: { include: { role: true } },
          customer: true,
          busOperator: true,
          staff: { include: { operator: true } },
        },
      });

      if (user) {
        await setUserCache(decoded.userId, user);
      }
    }

    if (!user || !user.isActive) {
      // Xóa cache nếu tài khoản bị khóa
      await invalidateUserCache(decoded.userId);
      return res.status(401).json({ success: false, message: 'Tài khoản không hợp lệ hoặc đã bị khóa.' });
    }

    req.user = user;
    req.roles = user.userRoles.map((ur) => ur.role.name);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
    }
    return res.status(401).json({ success: false, message: 'Token không hợp lệ.' });
  }
};

/**
 * Middleware phân quyền theo role
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.roles || !allowedRoles.some((r) => req.roles.includes(r))) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện thao tác này.' });
    }
    next();
  };
};

const requireApprovedOperator = (req, res, next) => {
  if (!req.user?.busOperator?.isApproved) {
    return res.status(403).json({ success: false, message: 'Nhà xe chưa được duyệt.' });
  }
  next();
};

module.exports = { authenticate, authorize, requireApprovedOperator, invalidateUserCache };
