import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setSearchParams } from '../store/slices/tripSlice';
import { format } from 'date-fns';
import { findCity, normalizeText } from '../constants/travel';

import HeroSection from './home/components/HeroSection';
import DestinationsGallery from './home/components/DestinationsGallery';
import ActivityFeedSection from './home/components/ActivityFeedSection';
import TestimonialsSection from './home/components/TestimonialsSection';

export default function HomePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const today = format(new Date(), 'yyyy-MM-dd');

  const [form, setForm] = useState({ origin: '', destination: '', date: today });
  const [selectedCity, setSelectedCity] = useState({ origin: '', destination: '' });
  const [error, setError] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    setError('');
    
    if (!form.origin || !form.destination || !form.date) return;

    const validOrigin = findCity(form.origin);
    const validDest = findCity(form.destination);

    if (!validOrigin) {
      setError('Vui lòng nhập Điểm đi hợp lệ (ví dụ: Hà Nội, Hồ Chí Minh).');
      return;
    }
    if (!validDest) {
      setError('Vui lòng nhập Điểm đến hợp lệ (ví dụ: Đà Lạt, Nha Trang).');
      return;
    }
    if (normalizeText(validOrigin) === normalizeText(validDest)) {
      setError('Điểm đi và điểm đến phải là hai thành phố khác nhau.');
      return;
    }

    const searchForm = { ...form, origin: validOrigin, destination: validDest };
    dispatch(setSearchParams(searchForm));
    navigate(
      `/search?origin=${encodeURIComponent(validOrigin)}&destination=${encodeURIComponent(validDest)}&date=${form.date}`
    );
  };

  const handleQuickRoute = (origin, dest) => {
    navigate(`/search?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}&date=${today}`);
  };

  return (
    <div className="font-nunito bg-sand dark:bg-slate-900 transition-colors duration-300 min-h-screen flex flex-col">
      {/* Toast Notification Error */}
      {error && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-red-50 text-red-600 px-6 py-3 rounded-full font-bold shadow-lg border border-red-200 flex items-center gap-2 animate-bounce">
          <i className="ti ti-alert-circle text-xl" />
          {error}
          <button onClick={() => setError('')} className="ml-2 hover:opacity-70">
            <i className="ti ti-x" />
          </button>
        </div>
      )}

      <HeroSection 
        form={form} 
        setForm={setForm} 
        selectedCity={selectedCity} 
        setSelectedCity={setSelectedCity} 
        handleSearch={handleSearch} 
        handleQuickRoute={handleQuickRoute} 
        today={today} 
      />

      <DestinationsGallery handleQuickRoute={handleQuickRoute} />
      
      <ActivityFeedSection />
      
      <TestimonialsSection />
      
    </div>
  );
}
