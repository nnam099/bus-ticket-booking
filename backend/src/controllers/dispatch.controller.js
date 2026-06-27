const dispatchService = require('../services/dispatch.service');

const assignVehicle = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { vehicleId } = req.body;
    const actorId = req.user.id;
    
    const trip = await dispatchService.assignVehicle(tripId, vehicleId, actorId);
    res.json({ success: true, data: trip, message: 'Phân công xe thành công.' });
  } catch (error) {
    next(error);
  }
};

const assignCrew = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { staffIds } = req.body;
    const actorId = req.user.id;
    
    const trip = await dispatchService.assignCrew(tripId, staffIds, actorId);
    res.json({ success: true, data: trip, message: 'Phân công nhân viên thành công.' });
  } catch (error) {
    next(error);
  }
};

const approveDeparture = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const actorId = req.user.id;
    
    const trip = await dispatchService.approveDeparture(tripId, actorId);
    res.json({ success: true, data: trip, message: 'Phê duyệt khởi hành thành công.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { assignVehicle, assignCrew, approveDeparture };
