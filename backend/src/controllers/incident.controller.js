const incidentService = require('../services/incident.service');

const reportIncident = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { type, description, severity } = req.body;
    
    const result = await incidentService.reportIncident(tripId, type, description, severity);
    res.status(201).json({ success: true, data: result, message: 'Báo cáo sự cố thành công.' });
  } catch (error) {
    next(error);
  }
};

const resolveIncident = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user.id;
    
    const result = await incidentService.resolveIncident(id, actorId);
    res.json({ success: true, data: result, message: 'Đã xử lý sự cố.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { reportIncident, resolveIncident };
