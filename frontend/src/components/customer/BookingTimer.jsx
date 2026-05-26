import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { resetBooking } from '../../store/slices/bookingSlice';
import { useNavigate } from 'react-router-dom';
import { bookingAPI } from '../../services/api';

export default function BookingTimer({ expiresAt, tripId, seatIds = [], redirectTo, onExpired }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    let released = false;
    const calc = () => Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000));
    const expire = async () => {
      if (released) return;
      released = true;
      if (tripId && seatIds.length) {
        try {
          await bookingAPI.releaseSeats({ tripId, seatIds });
        } catch {
          // Seat locks also expire in Redis; keep the UI moving even if release fails.
        }
      }
      onExpired?.();
      dispatch(resetBooking());
      if (redirectTo) navigate(redirectTo, { replace: true });
      else navigate(-1);
    };

    setSecondsLeft(calc());

    const interval = setInterval(() => {
      const remaining = calc();
      setSecondsLeft(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        expire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, tripId, JSON.stringify(seatIds), redirectTo]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const urgent = secondsLeft < 120;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-4 text-sm font-medium
      ${urgent ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-orange-50 border border-orange-200 text-orange-700'}`}>
      <span className="text-lg">⏱️</span>
      <span>
        Thời gian giữ chỗ còn lại:{' '}
        <strong>{mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}</strong>
      </span>
      {urgent && <span className="ml-auto animate-pulse">⚠️ Sắp hết hạn!</span>}
    </div>
  );
}
