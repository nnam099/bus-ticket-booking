// vehicle.routes.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const prisma = new PrismaClient();

router.get('/', authenticate, authorize('BUS_OPERATOR'), async (req, res, next) => {
  try {
    const operatorId = req.user.busOperator?.id;
    const vehicles = await prisma.vehicle.findMany({
      where: { operatorId },
      include: { vehicleType: { include: { seatLayouts: true } } },
    });
    res.json({ success: true, data: vehicles });
  } catch (err) { next(err); }
});

router.post('/', authenticate, authorize('BUS_OPERATOR'), async (req, res, next) => {
  try {
    const { vehicleTypeId, licensePlate, manufactureYear } = req.body;
    const operatorId = req.user.busOperator?.id;
    const vehicle = await prisma.vehicle.create({ data: { operatorId, vehicleTypeId, licensePlate, manufactureYear } });
    res.status(201).json({ success: true, data: vehicle });
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, authorize('BUS_OPERATOR'), async (req, res, next) => {
  try {
    const operatorId = req.user.busOperator?.id;
    const existing = await prisma.vehicle.findFirst({ where: { id: req.params.id, operatorId } });
    if (!existing) return res.status(403).json({ success: false, message: 'Không có quyền chỉnh sửa xe này.' });
    const vehicle = await prisma.vehicle.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: vehicle });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, authorize('BUS_OPERATOR'), async (req, res, next) => {
  try {
    const operatorId = req.user.busOperator?.id;
    const existing = await prisma.vehicle.findFirst({ where: { id: req.params.id, operatorId } });
    if (!existing) return res.status(403).json({ success: false, message: 'Không có quyền xóa xe này.' });
    await prisma.vehicle.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true, message: 'Đã xóa xe.' });
  } catch (err) { next(err); }
});

module.exports = router;
