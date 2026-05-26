// vehicle.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize, requireApprovedOperator } = require('../middlewares/auth.middleware');
const prisma = require('../config/prisma');

const parseOptionalInt = (value) => {
  if (value === undefined || value === '') return undefined;
  return Number.parseInt(value, 10);
};

const vehicleDataFromBody = (body) => ({
  vehicleTypeId: body.vehicleTypeId,
  licensePlate: body.licensePlate,
  manufactureYear: parseOptionalInt(body.manufactureYear),
  isActive: body.isActive,
});

router.get('/', authenticate, authorize('BUS_OPERATOR'), requireApprovedOperator, async (req, res, next) => {
  try {
    const operatorId = req.user.busOperator?.id;
    const vehicles = await prisma.vehicle.findMany({
      where: { operatorId },
      include: { vehicleType: { include: { seatLayouts: true } } },
    });
    res.json({ success: true, data: vehicles });
  } catch (err) { next(err); }
});

router.get('/types', authenticate, authorize('BUS_OPERATOR'), requireApprovedOperator, async (req, res, next) => {
  try {
    const vehicleTypes = await prisma.vehicleType.findMany({
      select: { id: true, name: true, seatCount: true, description: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: vehicleTypes });
  } catch (err) { next(err); }
});

router.post('/', authenticate, authorize('BUS_OPERATOR'), requireApprovedOperator, async (req, res, next) => {
  try {
    const operatorId = req.user.busOperator?.id;
    const vehicle = await prisma.vehicle.create({ data: { ...vehicleDataFromBody(req.body), operatorId } });
    res.status(201).json({ success: true, data: vehicle });
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, authorize('BUS_OPERATOR'), requireApprovedOperator, async (req, res, next) => {
  try {
    const operatorId = req.user.busOperator?.id;
    const existing = await prisma.vehicle.findFirst({ where: { id: req.params.id, operatorId } });
    if (!existing) return res.status(403).json({ success: false, message: 'Không có quyền chỉnh sửa xe này.' });
    const vehicle = await prisma.vehicle.update({ where: { id: req.params.id }, data: vehicleDataFromBody(req.body) });
    res.json({ success: true, data: vehicle });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, authorize('BUS_OPERATOR'), requireApprovedOperator, async (req, res, next) => {
  try {
    const operatorId = req.user.busOperator?.id;
    const existing = await prisma.vehicle.findFirst({ where: { id: req.params.id, operatorId } });
    if (!existing) return res.status(403).json({ success: false, message: 'Không có quyền xóa xe này.' });
    await prisma.vehicle.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true, message: 'Đã xóa xe.' });
  } catch (err) { next(err); }
});

module.exports = router;
