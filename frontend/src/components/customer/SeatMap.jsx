import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleSeat } from '../../store/slices/bookingSlice';
import { joinTripRoom, leaveTripRoom, onSeatsUpdated, connectSocket } from '../../services/socket';

export default function SeatMap({ tripSeats, tripId }) {
  const dispatch = useDispatch();
  const { selectedSeats } = useSelector(s => s.booking);
  const [seats, setSeats] = useState(tripSeats || []);

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

  useEffect(() => { setSeats(tripSeats || []); }, [tripSeats]);

  const getSeatClass = useCallback((seat) => {
    const isSelected = selectedSeats.some(s => s.id === seat.id);
    if (isSelected) return 'seat seat-selected';
    switch (seat.status) {
      case 'AVAILABLE': return 'seat seat-available';
      case 'PROCESSING': return 'seat seat-processing';
      case 'BOOKED': return 'seat seat-booked';
      case 'UNAVAILABLE': return 'seat seat-unavailable';
      default: return 'seat seat-unavailable';
    }
  }, [selectedSeats]);

  const handleClick = useCallback((seat) => {
    if (seat.status !== 'AVAILABLE' && !selectedSeats.some(s => s.id === seat.id)) return;
    dispatch(toggleSeat({ id: seat.id, seatCode: seat.seatLayout.seatCode, price: seat.price }));
  }, [dispatch, selectedSeats]);

  const floors = [...new Set(seats.map(s => s.seatLayout.floor))].sort((a, b) => a - b);

  const renderSeat = (seat) => {
    if (!seat) return <div className="bus-seat-placeholder" />;

    return (
      <button
        key={seat.id}
        onClick={() => handleClick(seat)}
        className={`${getSeatClass(seat)} bus-seat`}
        title={`Ghế ${seat.seatLayout.seatCode}`}
        disabled={seat.status === 'BOOKED' || seat.status === 'UNAVAILABLE' || seat.status === 'PROCESSING'}
      >
        {seat.seatLayout.seatCode}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {floors.map(floor => {
        const floorSeats = seats.filter(s => s.seatLayout.floor === floor);
        const rows = [...new Set(floorSeats.map(s => s.seatLayout.row))].sort((a, b) => a - b);
        const maxCol = Math.max(...floorSeats.map(s => s.seatLayout.col));
        const aisleAfter = Math.ceil(maxCol / 2);
        const leftCols = Array.from({ length: aisleAfter }, (_, index) => index + 1);
        const rightCols = Array.from({ length: maxCol - aisleAfter }, (_, index) => aisleAfter + index + 1);
        const gridTemplateColumns = `1.25rem repeat(${leftCols.length}, 2.75rem) minmax(1.5rem, 2rem) repeat(${rightCols.length}, 2.75rem)`;

        return (
          <section key={floor} className="bus-floor">
            <div className="bus-floor-title">
              <span>{floors.length > 1 ? `Tầng ${floor}` : 'Sơ đồ xe'}</span>
              <span>{floorSeats.length} ghế</span>
            </div>

            <div className="bus-shell">
              <div className="bus-window-strip" />
              <div className="bus-front">
                <div className="bus-windshield" />
                <div className="bus-driver">
                  <span className="bus-steering" aria-hidden="true" />
                  <span>Tài xế</span>
                </div>
                <div className="bus-door">Cửa lên</div>
              </div>

              <div className="bus-seat-grid" style={{ gridTemplateColumns }}>
                <div />
                {leftCols.map(col => (
                  <div key={`left-head-${col}`} className="bus-lane-label">
                    {floorSeats.find(seat => seat.seatLayout.col === col)?.seatLayout.seatCode?.replace(/\d+$/, '')}
                  </div>
                ))}
                <div className="bus-aisle-label">Lối đi</div>
                {rightCols.map(col => (
                  <div key={`right-head-${col}`} className="bus-lane-label">
                    {floorSeats.find(seat => seat.seatLayout.col === col)?.seatLayout.seatCode?.replace(/\d+$/, '')}
                  </div>
                ))}

                {rows.map(row => {
                  const rowSeats = floorSeats.filter(s => s.seatLayout.row === row);
                  return (
                    <div key={row} className="contents">
                      <span className="bus-row-number">{row}</span>
                      {leftCols.map(col => (
                        <div key={`${row}-${col}`} className="bus-seat-cell">
                          {renderSeat(rowSeats.find(s => s.seatLayout.col === col))}
                        </div>
                      ))}
                      <div className="bus-aisle" />
                      {rightCols.map(col => (
                        <div key={`${row}-${col}`} className="bus-seat-cell">
                          {renderSeat(rowSeats.find(s => s.seatLayout.col === col))}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              <div className="bus-rear">
                <span>Khoang sau</span>
              </div>
            </div>
          </section>
        );
      })}

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
