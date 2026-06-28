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
    if (isSelected) return 'bg-gradient-to-br from-orange-400 to-brand border-transparent text-white shadow-[0_4px_12px_rgba(232,93,4,0.35)] scale-105';
    switch (seat.status) {
      case 'AVAILABLE': return 'bg-white border-gray-200 text-gray-600 hover:border-brand hover:bg-orange-50 hover:text-brand hover:-translate-y-1 hover:shadow-md dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:border-brand dark:hover:bg-brand/10 dark:hover:text-orange-500';
      case 'PROCESSING': return 'bg-amber-100 border-amber-400 text-amber-700 cursor-not-allowed shadow-[0_0_8px_rgba(251,191,36,0.5)] dark:bg-amber-500/20 dark:border-amber-400 dark:text-amber-300 dark:shadow-[0_0_10px_rgba(251,191,36,0.4)]';
      case 'BOOKED': return 'bg-slate-300 border-slate-400 text-slate-700 cursor-not-allowed dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300';
      case 'UNAVAILABLE': return 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed opacity-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-600';
      default: return 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed opacity-50 dark:bg-slate-900 dark:border-slate-800';
    }
  }, [selectedSeats]);

  const handleClick = useCallback((seat) => {
    if (seat.status !== 'AVAILABLE' && !selectedSeats.some(s => s.id === seat.id)) return;
    dispatch(toggleSeat({ id: seat.id, seatCode: seat.seatLayout.seatCode, price: seat.price }));
  }, [dispatch, selectedSeats]);

  const floors = [...new Set(seats.map(s => s.seatLayout.floor))].sort((a, b) => a - b);

  const renderSeat = (seat) => {
    return (
      <button
        key={seat.id}
        onClick={() => handleClick(seat)}
        className={`w-full h-full rounded-[10px] flex items-center justify-center text-xs font-bold cursor-pointer transition-all duration-300 border-[1.5px] select-none outline-none ${getSeatClass(seat)}`}
        title={`Ghế ${seat.seatLayout.seatCode}`}
        disabled={seat.status === 'BOOKED' || seat.status === 'UNAVAILABLE' || (seat.status === 'PROCESSING' && !selectedSeats.some(s => s.id === seat.id))}
      >
        {seat.seatLayout.seatCode}
      </button>
    );
  };

  return (
    <div className="space-y-8">
      {floors.map(floor => {
        const floorSeats = seats.filter(s => s.seatLayout.floor === floor);
        const rows = [...new Set(floorSeats.map(s => s.seatLayout.row))].sort((a, b) => a - b);
        const maxCol = Math.max(...floorSeats.map(s => s.seatLayout.col));
        const aisleAfter = Math.ceil(maxCol / 2);
        const leftCols = Array.from({ length: aisleAfter }, (_, index) => index + 1);
        const rightCols = Array.from({ length: maxCol - aisleAfter }, (_, index) => aisleAfter + index + 1);
        
        // Vertical mapping: Columns = maxCol + 1 (for aisle)
        const gridTemplateColumns = `repeat(${maxCol + 1}, minmax(0, 1fr))`;

        return (
          <section key={floor} className="w-full max-w-sm mx-auto pb-6">
            <div className="w-full">
              <div className="mb-4 flex items-center justify-between text-sm font-bold text-gray-700 dark:text-slate-300 px-2">
                <span className="text-gray-800 dark:text-slate-100">{floors.length > 1 ? `Tầng ${floor}` : 'Sơ đồ xe'}</span>
                <span className="rounded-full bg-orange-50 text-brand px-3 py-1 text-xs border border-orange-100 shadow-sm dark:bg-brand/10 dark:border-brand/20">{floorSeats.length} ghế</span>
              </div>

              {/* Bus Shell (Vertical) */}
              <div className="relative flex flex-col rounded-[2.5rem] bg-white p-4 shadow-[0_8px_30px_rgba(74,59,50,0.08)] border border-orange-100/50 dark:bg-slate-900/95 dark:border-slate-800 dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
                
                {/* Front of bus (Top side) */}
                <div className="relative flex items-center justify-between w-full h-16 mb-6 rounded-t-[2rem] border-b border-gray-100 bg-gray-50/50 px-4 dark:bg-slate-800/50 dark:border-slate-700/50">
                  <div className="h-4 w-3/4 rounded-t-2xl rounded-b-xl border border-sky-100 bg-gradient-to-t from-sky-50 to-white shadow-inner dark:border-sky-900/20 dark:from-slate-800 dark:to-slate-900/80 absolute top-2 left-1/2 -translate-x-1/2" />
                  
                  {/* Tài xế (Left side of bus front) */}
                  <div className="flex flex-col items-center gap-1 z-10">
                    <div className="h-7 w-7 rounded-full border-2 border-gray-300 shadow-sm bg-white dark:bg-slate-800 dark:border-slate-600 flex items-center justify-center">
                      <div className="h-2.5 w-2.5 rounded-full bg-gray-300 dark:bg-slate-600" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Tài xế</span>
                  </div>

                  {/* Cửa lên (Right side of bus front) */}
                  <div className="z-10 rounded-lg border border-brand/20 bg-orange-50/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-brand shadow-sm backdrop-blur-sm dark:bg-brand/10 dark:border-brand/30">
                    Cửa lên
                  </div>
                </div>

                {/* Seat Grid */}
                <div className="relative grid gap-x-3 gap-y-4 p-1" style={{ gridTemplateColumns }}>
                  
                  {/* Column Headers (A, Lối đi, B) */}
                  <div className="contents">
                    {Array.from({ length: Math.ceil(maxCol / 2) }, (_, i) => i + 1).map(col => (
                      <div key={`header-col-${col}`} className="flex justify-center text-[12px] font-black text-gray-400 dark:text-slate-500">
                        {floorSeats.find(s => s.seatLayout.col === col)?.seatLayout.seatCode?.replace(/\d+$/, '') || ''}
                      </div>
                    ))}
                    
                    <div className="flex justify-center text-[10px] font-bold uppercase tracking-widest text-gray-300 dark:text-slate-600">
                      Lối đi
                    </div>
                    
                    {Array.from({ length: Math.floor(maxCol / 2) }, (_, i) => i + Math.ceil(maxCol / 2) + 1).map(col => (
                      <div key={`header-col-${col}`} className="flex justify-center text-[12px] font-black text-gray-400 dark:text-slate-500">
                        {floorSeats.find(s => s.seatLayout.col === col)?.seatLayout.seatCode?.replace(/\d+$/, '') || ''}
                      </div>
                    ))}
                  </div>

                  {/* Seats by Row (1, 2, 3...) */}
                  {rows.map(row => (
                    <div key={`row-${row}`} className="contents">
                      
                      {/* Left side cols */}
                      {Array.from({ length: Math.ceil(maxCol / 2) }, (_, i) => i + 1).map(col => (
                        <div key={`${row}-${col}`} className="flex justify-center relative z-10 w-full max-w-[48px] mx-auto">
                          <div className="w-full aspect-square">
                            {renderSeat(floorSeats.find(s => s.seatLayout.row === row && s.seatLayout.col === col))}
                          </div>
                        </div>
                      ))}
                      
                      {/* Aisle space */}
                      <div className="flex items-center justify-center text-[11px] font-bold text-gray-300 dark:text-slate-600 select-none">
                        {row}
                      </div>

                      {/* Right side cols */}
                      {Array.from({ length: Math.floor(maxCol / 2) }, (_, i) => i + Math.ceil(maxCol / 2) + 1).map(col => (
                        <div key={`${row}-${col}`} className="flex justify-center relative z-10 w-full max-w-[48px] mx-auto">
                          <div className="w-full aspect-square">
                            {renderSeat(floorSeats.find(s => s.seatLayout.row === row && s.seatLayout.col === col))}
                          </div>
                        </div>
                      ))}
                      
                    </div>
                  ))}

                  {/* Aisle dashed line overlay (Vertical) */}
                  <div className="absolute top-8 bottom-4 left-1/2 -translate-x-1/2 w-6 border-x-2 border-dashed border-gray-200/60 dark:border-slate-700/40 pointer-events-none rounded-full" />
                </div>

                {/* Rear of bus (Bottom side) */}
                <div className="flex items-center justify-center w-full h-8 mt-6 rounded-b-[1.5rem] border-t border-gray-100 bg-gray-50/50 dark:bg-slate-800/50 dark:border-slate-700/50">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">Khoang sau</span>
                </div>

              </div>
            </div>
          </section>
        );
      })}

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 pt-4 border-t border-gray-100 dark:border-slate-800 text-xs">
        {[
          { cls: 'bg-white border-gray-200 dark:bg-slate-800 dark:border-slate-600', label: 'Còn trống' },
          { cls: 'bg-gradient-to-br from-orange-400 to-brand border-transparent', label: 'Đang chọn' },
          { cls: 'bg-amber-100 border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)] dark:bg-amber-500/20 dark:border-amber-400 dark:shadow-[0_0_10px_rgba(251,191,36,0.4)]', label: 'Đang giữ' },
          { cls: 'bg-slate-300 border-slate-400 dark:bg-slate-700 dark:border-slate-600', label: 'Đã bán' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-[6px] border-[1.5px] ${l.cls}`} />
            <span className="text-gray-600 dark:text-slate-400 font-medium">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
