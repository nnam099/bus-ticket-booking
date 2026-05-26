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

const routeDataFromBody = (body) => ({
  originCity: body.originCity,
  destinationCity: body.destinationCity,
  originAddress: body.originAddress,
  destinationAddress: body.destinationAddress,
  distanceKm: parseOptionalFloat(body.distanceKm),
  durationMinutes: parseOptionalInt(body.durationMinutes),
  isActive: body.isActive,
});

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
    const route = await prisma.route.create({ data: { ...routeDataFromBody(req.body), operatorId } });
    res.status(201).json({ success: true, data: route });
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, authorize('BUS_OPERATOR'), requireApprovedOperator, async (req, res, next) => {
  try {
    const operatorId = req.user.busOperator?.id;
    const existing = await prisma.route.findFirst({ where: { id: req.params.id, operatorId } });
    if (!existing) return res.status(403).json({ success: false, message: 'Không có quyền chỉnh sửa tuyến này.' });
    const route = await prisma.route.update({ where: { id: req.params.id }, data: routeDataFromBody(req.body) });
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

    await prisma.route.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true, message: 'Đã xóa tuyến xe.' });
  } catch (err) { next(err); }
});

module.exports = router;
