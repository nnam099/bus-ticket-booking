const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const incidentController = require('../controllers/incident.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const validateReport = [
  param('tripId').isUUID().withMessage('Mã chuyến đi không hợp lệ.'),
  body('type').isIn(['BREAKDOWN', 'TRAFFIC', 'WEATHER', 'OTHER']).withMessage('Loại sự cố không hợp lệ.'),
  body('severity').isIn(['LOW', 'HIGH', 'CRITICAL']).withMessage('Mức độ không hợp lệ.'),
  body('description').notEmpty().withMessage('Mô tả không được để trống.')
];

const validateResolve = [
  param('id').isUUID().withMessage('Mã sự cố không hợp lệ.')
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
  '/:tripId',
  authenticate,
  authorize('BUS_OPERATOR', 'STAFF'),
  validateReport,
  handleValidationErrors,
  incidentController.reportIncident
);

router.post(
  '/:id/resolve',
  authenticate,
  authorize('BUS_OPERATOR', 'STAFF'),
  validateResolve,
  handleValidationErrors,
  incidentController.resolveIncident
);

module.exports = router;
