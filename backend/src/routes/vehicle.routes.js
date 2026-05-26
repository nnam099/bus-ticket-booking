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
  licensePlate: String(body.licensePlate || '').trim().toUpperCase(),
  manufactureYear: parseOptionalInt(body.manufactureYear),
  isActive: body.isActive,
});

const validateVehicleData = async (data) => {
  if (!data.vehicleTypeId || !data.licensePlate) return 'Vui lòng chọn loại xe và nhập biển số xe.';
  if (!/^[0-9A-Z.-]{6,12}$/.test(data.licensePlate)) return 'Biển số xe không hợp lệ.';
  const currentYear = new Date().getFullYear();
  if (data.manufactureYear !== undefined && (!Number.isInteger(data.manufactureYear) || data.manufactureYear < 1990 || data.manufactureYear > currentYear + 1)) {
    return 'Năm sản xuất xe không hợp lệ.';
  }
  const vehicleType = await prisma.vehicleType.findUnique({ where: { id: data.vehicleTypeId }, select: { id: true } });
  if (!vehicleType) return 'Loại xe không tồn tại.';
  return null;
};

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
    const data = vehicleDataFromBody(req.body);
    const validationError = await validateVehicleData(data);
    if (validationError) return res.status(400).json({ success: false, message: validationError });
    const vehicle = await prisma.vehicle.create({ data: { ...data, operatorId } });
    res.status(201).json({ success: true, data: vehicle });
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, authorize('BUS_OPERATOR'), requireApprovedOperator, async (req, res, next) => {
  try {
    const operatorId = req.user.busOperator?.id;
    const existing = await prisma.vehicle.findFirst({ where: { id: req.params.id, operatorId } });
    if (!existing) return res.status(403).json({ success: false, message: 'Không có quyền chỉnh sửa xe này.' });
    const data = vehicleDataFromBody(req.body);
    const validationError = await validateVehicleData(data);
    if (validationError) return res.status(400).json({ success: false, message: validationError });
    const vehicle = await prisma.vehicle.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: vehicle });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, authorize('BUS_OPERATOR'), requireApprovedOperator, async (req, res, next) => {
  try {
    const operatorId = req.user.busOperator?.id;
    const existing = await prisma.vehicle.findFirst({ where: { id: req.params.id, operatorId } });
    if (!existing) return res.status(403).json({ success: false, message: 'Không có quyền xóa xe này.' });
    const upcomingTrips = await prisma.trip.count({
      where: {
        vehicleId: req.params.id,
        status: { in: ['SCHEDULED', 'BOARDING', 'DELAYED'] },
        departureTime: { gt: new Date() },
      },
    });
    if (upcomingTrips > 0) {
      return res.status(409).json({ success: false, message: 'Không thể xóa xe đang có chuyến sắp chạy.' });
    }
    await prisma.vehicle.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true, message: 'Đã xóa xe.' });
  } catch (err) { next(err); }
});

module.exports = router;
