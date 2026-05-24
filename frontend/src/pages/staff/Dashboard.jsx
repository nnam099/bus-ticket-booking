// staff/Dashboard.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { staffAPI } from '../../services/api';
import { format } from 'date-fns';

const normalizeText = (value) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');

export default function StaffDashboard() {
  const [trips, setTrips] = useState([]);
  const [query, setQuery] = useState('');
  useEffect(() => { staffAPI.getAssignedTrips().then(r => setTrips(r.data.data)); }, []);

  const normalizedQuery = normalizeText(query.trim());
  const filteredTrips = normalizedQuery
    ? trips.filter((trip) => normalizeText([
      trip.route?.originCity,
      trip.route?.destinationCity,
      trip.vehicle?.licensePlate,
    ].filter(Boolean).join(' ')).includes(normalizedQuery))
    : trips;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Chuyến xe của tôi</h1>
          <p className="mt-1 text-sm text-gray-500">{filteredTrips.length} chuyến được hiển thị</p>
        </div>
        <div className="w-full md:max-w-sm">
          <label className="label">Lọc chuyến</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">🔎</span>
            <input
              className="input pl-10"
              placeholder="Nhập H, Hồ Chí Minh, Đà Lạt..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {filteredTrips.map(trip => (
          <div key={trip.id} className="card flex items-center justify-between">
            <div>
              <p className="font-semibold">{trip.route?.originCity} → {trip.route?.destinationCity}</p>
              <p className="text-sm text-gray-500">{format(new Date(trip.departureTime), 'HH:mm dd/MM/yyyy')} • {trip.vehicle?.licensePlate}</p>
            </div>
            <Link to={`/staff/trips/${trip.id}/check-in`} className="btn-primary text-sm py-1.5">Soát vé</Link>
          </div>
        ))}
        {trips.length === 0 && <div className="card text-center py-12 text-gray-500"><p>Không có chuyến nào được phân công.</p></div>}
        {trips.length > 0 && filteredTrips.length === 0 && <div className="card text-center py-12 text-gray-500"><p>Không tìm thấy chuyến phù hợp.</p></div>}
      </div>
    </div>
  );
}
