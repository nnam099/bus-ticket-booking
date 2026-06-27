const express = require('express');
const router = express.Router();
const { param, body } = require('express-validator');
const scheduleController = require('../controllers/schedule.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const validateScheduleId = [
  param('scheduleId').isUUID().withMessage('Mã lịch trình không hợp lệ.'),
  body('daysAhead').optional().isInt({ min: 1, max: 90 }).withMessage('Số ngày tạo phải từ 1 đến 90.')
];

const handleValidationErrors = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array(), message: errors.array()[0].msg });
  }
  next();
};

router.post(
  '/:scheduleId/generate',
  authenticate,
  authorize('BUS_OPERATOR', 'ADMIN'),
  validateScheduleId,
  handleValidationErrors,
  scheduleController.generateTrips
);

module.exports = router;
