const scheduleService = require('../services/schedule.service');

const generateTrips = async (req, res, next) => {
  try {
    const { scheduleId } = req.params;
    const { daysAhead } = req.body;
    const actorId = req.user.id;
    
    const result = await scheduleService.generateTripsFromSchedule(scheduleId, actorId, daysAhead);
    res.json({ success: true, data: result, message: 'Đã tạo chuyến đi từ lịch trình.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { generateTrips };
