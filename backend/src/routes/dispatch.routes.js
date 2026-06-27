const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const dispatchController = require('../controllers/dispatch.controller');
const { authenticate, authorize, requireApprovedOperator } = require('../middlewares/auth.middleware');

// Validations
const validateTripId = [
  param('tripId').isUUID().withMessage('Mã chuyến đi không hợp lệ.'),
];

const validateVehicle = [
  ...validateTripId,
  body('vehicleId').isUUID().withMessage('Mã phương tiện không hợp lệ.')
];

const validateCrew = [
  ...validateTripId,
  body('staffIds').isArray({ min: 1 }).withMessage('Danh sách nhân viên không được để trống.'),
  body('staffIds.*').isUUID().withMessage('Mã nhân viên không hợp lệ.')
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
  '/:tripId/vehicle',
  authenticate,
  authorize('BUS_OPERATOR', 'STAFF'),
  validateVehicle,
  handleValidationErrors,
  dispatchController.assignVehicle
);

router.post(
  '/:tripId/crew',
  authenticate,
  authorize('BUS_OPERATOR', 'STAFF'),
  validateCrew,
  handleValidationErrors,
  dispatchController.assignCrew
);

router.post(
  '/:tripId/depart',
  authenticate,
  authorize('BUS_OPERATOR', 'STAFF'),
  validateTripId,
  handleValidationErrors,
  dispatchController.approveDeparture
);

module.exports = router;
