const express = require('express');
const router = express.Router();
const { authenticate, authorize, requireApprovedOperator } = require('../middlewares/auth.middleware');
const tripController = require('../controllers/trip.controller');

// GET /api/trips/search - Tìm kiếm chuyến xe (public)
router.get('/search', tripController.searchTrips);
router.get('/operator/me', authenticate, authorize('BUS_OPERATOR'), requireApprovedOperator, tripController.listOperatorTrips);

// GET /api/trips/:id - Chi tiết chuyến xe
router.get('/:id', tripController.getTripById);

// POST /api/trips - Tạo chuyến xe mới (BUS_OPERATOR only)
router.post('/', authenticate, authorize('BUS_OPERATOR'), requireApprovedOperator, tripController.createTrip);

// PATCH /api/trips/:id/status - Cập nhật trạng thái chuyến (Staff/Driver)
router.patch('/:id/status', authenticate, authorize('STAFF', 'BUS_OPERATOR'), tripController.updateTripStatus);

module.exports = router;
