const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Middleware xác thực JWT
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để tiếp tục.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        userRoles: { include: { role: true } },
        customer: true,
        busOperator: true,
        staff: true,
      },
    });

    if (!user || !user.isActive) {
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

module.exports = { authenticate, authorize };
