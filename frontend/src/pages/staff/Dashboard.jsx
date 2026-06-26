import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { staffAPI } from '../../services/api';
import { format } from 'date-fns';
import { PageHeader, Card, Input, Button, EmptyState } from '../../components/ui';

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
    <div className="space-y-6">
      <PageHeader 
        title="Chuyến xe của tôi" 
        description={`${filteredTrips.length} chuyến được hiển thị.`}
        actions={
          <div className="w-full md:w-64">
            <Input
              placeholder="Tìm điểm đến, biển số xe..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              icon="ti-search"
            />
          </div>
        }
      />

      <div className="space-y-4">
        {filteredTrips.map(trip => (
          <Card key={trip.id} hover className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-l-4 border-l-[#e85d04]">
            <div>
              <p className="font-black text-xl text-gray-900 dark:text-white flex items-center gap-2">
                {trip.route?.originCity} <i className="ti ti-arrow-right text-[#e85d04]" /> {trip.route?.destinationCity}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1.5"><i className="ti ti-calendar text-gray-400" /> {format(new Date(trip.departureTime), 'HH:mm dd/MM/yyyy')}</span>
                <span className="flex items-center gap-1.5"><i className="ti ti-bus text-gray-400" /> {trip.vehicle?.licensePlate}</span>
              </div>
            </div>
            <Link to={`/staff/trips/${trip.id}/check-in`} className="shrink-0 w-full sm:w-auto">
              <Button fullWidth icon={<i className="ti ti-ticket" />}>Soát vé</Button>
            </Link>
          </Card>
        ))}
        {trips.length === 0 && (
          <EmptyState title="Không có chuyến nào" description="Hiện tại chưa có chuyến nào được phân công cho bạn." icon="ti-bus" />
        )}
        {trips.length > 0 && filteredTrips.length === 0 && (
          <EmptyState title="Không tìm thấy chuyến" description="Không có chuyến nào khớp với tìm kiếm của bạn." icon="ti-search" />
        )}
      </div>
    </div>
  );
}
