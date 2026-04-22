// staff/Dashboard.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { staffAPI } from '../../services/api';
import { format } from 'date-fns';

export default function StaffDashboard() {
  const [trips, setTrips] = useState([]);
  useEffect(() => { staffAPI.getAssignedTrips().then(r => setTrips(r.data.data)); }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Chuyến xe của tôi</h1>
      <div className="space-y-4">
        {trips.map(trip => (
          <div key={trip.id} className="card flex items-center justify-between">
            <div>
              <p className="font-semibold">{trip.route?.originCity} → {trip.route?.destinationCity}</p>
              <p className="text-sm text-gray-500">{format(new Date(trip.departureTime), 'HH:mm dd/MM/yyyy')} • {trip.vehicle?.licensePlate}</p>
            </div>
            <Link to={`/staff/trips/${trip.id}/check-in`} className="btn-primary text-sm py-1.5">Soát vé</Link>
          </div>
        ))}
        {trips.length === 0 && <div className="card text-center py-12 text-gray-500"><p>Không có chuyến nào được phân công.</p></div>}
      </div>
    </div>
  );
}
