import { useState } from 'react';
import { cityOptions, normalizeText } from '../../constants/travel';

export default function CitySuggestInput({ label, icon, placeholder, value, onInputChange, onSelect }) {
  const [focused, setFocused] = useState(false);
  const query = normalizeText(value.trim());
  const suggestions = cityOptions.filter((city) => {
    if (!query) return true;
    const normalizedCity = normalizeText(city);
    const words = normalizedCity.split(' ');
    return normalizedCity.startsWith(query) || words.some((word) => word.startsWith(query));
  });

  return (
    <div className="relative flex-1 px-5 py-4 border-r-[1.5px] border-mocha-border">
      <div className="text-xs font-bold uppercase mb-1.5 text-brand tracking-[0.8px]">
        {label}
      </div>
      <div className="flex items-center gap-2">
        <i className={`ti ${icon} text-[18px] ${focused || value ? 'text-brand' : 'text-mocha-card'}`} />
        <input
          className={`bg-transparent border-none outline-none text-base font-semibold w-full ${value ? 'text-mocha' : 'text-mocha-card placeholder:text-mocha-card'}`}
          placeholder={placeholder}
          value={value}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onChange={(e) => onInputChange(e.target.value)}
          autoComplete="off"
          required
        />
      </div>
      {focused && suggestions.length > 0 && (
        <div className="absolute z-30 mt-3 w-64 overflow-hidden rounded-2xl bg-white shadow-[0_8px_32px_rgba(74,59,50,0.15)] border-[1.5px] border-mocha-border top-full left-0">
          {suggestions.slice(0, 8).map((city) => (
            <button
              key={city}
              type="button"
              className="w-full px-4 py-3 text-left text-sm font-semibold transition-colors hover:bg-peach text-mocha"
              onMouseDown={() => onSelect(city)}
            >
              <i className="ti ti-map-pin mr-2 text-brand text-[14px]" />
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
