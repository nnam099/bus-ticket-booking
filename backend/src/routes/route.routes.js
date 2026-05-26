// route.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize, requireApprovedOperator } = require('../middlewares/auth.middleware');
const prisma = require('../config/prisma');

const parseOptionalFloat = (value) => {
  if (value === undefined || value === '') return undefined;
  return Number.parseFloat(value);
};

const parseOptionalInt = (value) => {
  if (value === undefined || value === '') return undefined;
  return Number.parseInt(value, 10);
};

const normalizeText = (value) => String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');

const routeDataFromBody = (body) => ({
  originCity: String(body.originCity || '').trim(),
  destinationCity: String(body.destinationCity || '').trim(),
  originAddress: String(body.originAddress || '').trim(),
  destinationAddress: String(body.destinationAddress || '').trim(),
  distanceKm: parseOptionalFloat(body.distanceKm),
  durationMinutes: parseOptionalInt(body.durationMinutes),
  isActive: body.isActive,
});

const validateRouteData = (data) => {
  if (!data.originCity || !data.destinationCity || !data.originAddress || !data.destinationAddress) {
    return 'Vui lòng nhập đầy đủ điểm đi, điểm đến và địa chỉ bến xe.';
  }
  if (normalizeText(data.originCity) === normalizeText(data.destinationCity)) {
    return 'Điểm đi và điểm đến phải khác nhau.';
  }
  if (data.distanceKm !== undefined && (!Number.isFinite(data.distanceKm) || data.distanceKm <= 0)) {
    return 'Khoảng cách tuyến phải lớn hơn 0.';
  }
  if (data.durationMinutes !== undefined && (!Number.isInteger(data.durationMinutes) || data.durationMinutes <= 0)) {
    return 'Thời lượng tuyến phải là số phút lớn hơn 0.';
  }
  return null;
};

router.get('/', async (req, res, next) => {
  try {
    const { origin, destination } = req.query;
    const routes = await prisma.route.findMany({
      where: {
        isActive: true,
        ...(origin && { originCity: { contains: origin, mode: 'insensitive' } }),
        ...(destination && { destinationCity: { contains: destination, mode: 'insensitive' } }),
        operator: { isApproved: true, user: { isActive: true } },
      },
      include: { operator: { select: { companyName: true, logoUrl: true } } },
    });
    res.json({ success: true, data: routes });
  } catch (err) { next(err); }
});

router.get('/operator/me', authenticate, authorize('BUS_OPERATOR'), requireApprovedOperator, async (req, res, next) => {
  try {
    const operatorId = req.user.busOperator?.id;
    const routes = await prisma.route.findMany({
      where: { operatorId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: routes });
  } catch (err) { next(err); }
});

router.post('/', authenticate, authorize('BUS_OPERATOR'), requireApprovedOperator, async (req, res, next) => {
  try {
    const operatorId = req.user.busOperator?.id;
    const data = routeDataFromBody(req.body);
    const validationError = validateRouteData(data);
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    const duplicate = await prisma.route.findFirst({
      where: {
        operatorId,
        isActive: true,
        originCity: { equals: data.originCity, mode: 'insensitive' },
        destinationCity: { equals: data.destinationCity, mode: 'insensitive' },
      },
      select: { id: true },
    });
    if (duplicate) return res.status(409).json({ success: false, message: 'Tuyến này đã tồn tại.' });

    const route = await prisma.route.create({ data: { ...data, operatorId } });
    res.status(201).json({ success: true, data: route });
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, authorize('BUS_OPERATOR'), requireApprovedOperator, async (req, res, next) => {
  try {
    const operatorId = req.user.busOperator?.id;
    const existing = await prisma.route.findFirst({ where: { id: req.params.id, operatorId } });
    if (!existing) return res.status(403).json({ success: false, message: 'Không có quyền chỉnh sửa tuyến này.' });
    const data = routeDataFromBody(req.body);
    const validationError = validateRouteData(data);
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    const duplicate = await prisma.route.findFirst({
      where: {
        id: { not: req.params.id },
        operatorId,
        isActive: true,
        originCity: { equals: data.originCity, mode: 'insensitive' },
        destinationCity: { equals: data.destinationCity, mode: 'insensitive' },
      },
      select: { id: true },
    });
    if (duplicate) return res.status(409).json({ success: false, message: 'Tuyến này đã tồn tại.' });

    const route = await prisma.route.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: route });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, authorize('BUS_OPERATOR', 'ADMIN'), async (req, res, next) => {
  try {
    if (!req.roles?.includes('ADMIN')) {
      if (!req.user.busOperator?.isApproved) {
        return res.status(403).json({ success: false, message: 'Nhà xe chưa được duyệt.' });
      }
      const operatorId = req.user.busOperator?.id;
      const existing = await prisma.route.findFirst({ where: { id: req.params.id, operatorId } });
      if (!existing) return res.status(403).json({ success: false, message: 'Khong co quyen xoa tuyen nay.' });
    }

    const upcomingTrips = await prisma.trip.count({
      where: {
        routeId: req.params.id,
        status: { in: ['SCHEDULED', 'BOARDING', 'DELAYED'] },
        departureTime: { gt: new Date() },
      },
    });
    if (upcomingTrips > 0) {
      return res.status(409).json({ success: false, message: 'Không thể xóa tuyến đang có chuyến sắp chạy.' });
    }

    await prisma.route.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true, message: 'Đã xóa tuyến xe.' });
  } catch (err) { next(err); }
});

module.exports = router;
