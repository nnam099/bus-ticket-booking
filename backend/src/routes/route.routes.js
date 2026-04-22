// route.routes.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const prisma = new PrismaClient();

router.get('/', async (req, res, next) => {
  try {
    const { origin, destination } = req.query;
    const routes = await prisma.route.findMany({
      where: {
        isActive: true,
        ...(origin && { originCity: { contains: origin, mode: 'insensitive' } }),
        ...(destination && { destinationCity: { contains: destination, mode: 'insensitive' } }),
      },
      include: { operator: { select: { companyName: true, logoUrl: true } } },
    });
    res.json({ success: true, data: routes });
  } catch (err) { next(err); }
});

router.post('/', authenticate, authorize('BUS_OPERATOR'), async (req, res, next) => {
  try {
    const operatorId = req.user.busOperator?.id;
    const route = await prisma.route.create({ data: { operatorId, ...req.body } });
    res.status(201).json({ success: true, data: route });
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, authorize('BUS_OPERATOR'), async (req, res, next) => {
  try {
    const operatorId = req.user.busOperator?.id;
    const existing = await prisma.route.findFirst({ where: { id: req.params.id, operatorId } });
    if (!existing) return res.status(403).json({ success: false, message: 'Không có quyền chỉnh sửa tuyến này.' });
    const route = await prisma.route.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: route });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, authorize('BUS_OPERATOR', 'ADMIN'), async (req, res, next) => {
  try {
    await prisma.route.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true, message: 'Đã xóa tuyến xe.' });
  } catch (err) { next(err); }
});

module.exports = router;
