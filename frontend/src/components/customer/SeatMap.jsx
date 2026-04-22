import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleSeat } from '../../store/slices/bookingSlice';
import { joinTripRoom, leaveTripRoom, onSeatsUpdated, connectSocket } from '../../services/socket';

export default function SeatMap({ tripSeats, tripId }) {
  const dispatch = useDispatch();
  const { selectedSeats } = useSelector(s => s.booking);
  const [seats, setSeats] = useState(tripSeats || []);

  // Real-time seat updates via Socket.IO
  useEffect(() => {
    connectSocket();
    joinTripRoom(tripId);

    const unsubscribe = onSeatsUpdated(({ seatIds, status }) => {
      setSeats(prev => prev.map(s =>
        seatIds.includes(s.id) ? { ...s, status } : s
      ));
    });

    return () => {
      unsubscribe();
      leaveTripRoom(tripId);
    };
  }, [tripId]);

  // Sync with props
  useEffect(() => { setSeats(tripSeats || []); }, [tripSeats]);

  const getSeatClass = useCallback((seat) => {
    const isSelected = selectedSeats.some(s => s.id === seat.id);
    if (isSelected) return 'seat seat-selected';
    switch (seat.status) {
      case 'AVAILABLE':   return 'seat seat-available';
      case 'PROCESSING':  return 'seat seat-processing';
      case 'BOOKED':      return 'seat seat-booked';
      case 'UNAVAILABLE': return 'seat seat-unavailable';
      default:            return 'seat seat-unavailable';
    }
  }, [selectedSeats]);

  const handleClick = useCallback((seat) => {
    if (seat.status !== 'AVAILABLE' && !selectedSeats.some(s => s.id === seat.id)) return;
    dispatch(toggleSeat({ id: seat.id, seatCode: seat.seatLayout.seatCode, price: seat.price }));
  }, [dispatch, selectedSeats]);

  // Group seats by floor and row
  const floors = [...new Set(seats.map(s => s.seatLayout.floor))].sort();

  return (
    <div className="space-y-6">
      {floors.map(floor => {
        const floorSeats = seats.filter(s => s.seatLayout.floor === floor);
        const rows = [...new Set(floorSeats.map(s => s.seatLayout.row))].sort((a, b) => a - b);
        const maxCol = Math.max(...floorSeats.map(s => s.seatLayout.col));

        return (
          <div key={floor}>
            {floors.length > 1 && (
              <p className="text-sm font-semibold text-gray-600 mb-2">Tầng {floor}</p>
            )}
            {/* Driver cabin */}
            <div className="flex justify-end mb-3">
              <div className="w-12 h-8 bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-500">
                🚗
              </div>
            </div>
            <div className="space-y-2">
              {rows.map(row => {
                const rowSeats = floorSeats.filter(s => s.seatLayout.row === row);
                return (
                  <div key={row} className="flex gap-2 items-center">
                    <span className="text-xs text-gray-400 w-4">{row}</span>
                    {Array.from({ length: maxCol }, (_, colIdx) => {
                      const seat = rowSeats.find(s => s.seatLayout.col === colIdx + 1);
                      if (!seat) return <div key={colIdx} className="w-10 h-10" />;
                      return (
                        <button
                          key={seat.id}
                          onClick={() => handleClick(seat)}
                          className={getSeatClass(seat)}
                          title={`Ghế ${seat.seatLayout.seatCode}`}
                          disabled={seat.status === 'BOOKED' || seat.status === 'UNAVAILABLE' || seat.status === 'PROCESSING'}
                        >
                          {seat.seatLayout.seatCode}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100 text-xs">
        {[
          { cls: 'seat-available', label: 'Còn trống' },
          { cls: 'seat-selected', label: 'Đang chọn' },
          { cls: 'seat-processing', label: 'Đang giữ' },
          { cls: 'seat-booked', label: 'Đã bán' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-5 h-5 rounded seat ${l.cls}`} />
            <span className="text-gray-600">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
