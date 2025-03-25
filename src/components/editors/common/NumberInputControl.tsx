'use client';

import { useState, useEffect } from 'react';

interface NumberInputControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  minValue?: number;
  maxValue?: number;
  defaultValue?: number;
  step?: number;
  className?: string;
}

export default function NumberInputControl({
  label,
  value,
  onChange,
  suffix,
  minValue = 1,
  maxValue = Number.MAX_SAFE_INTEGER,
  defaultValue = 1,
  step = 1,
  className = ''
}: NumberInputControlProps) {
  const [inputValue, setInputValue] = useState<string | number>(value);

  // Keep local state in sync with parent value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleDecrement = () => {
    const newValue = Math.max(minValue, value - step);
    onChange(newValue);
  };

  const handleIncrement = () => {
    const newValue = Math.min(maxValue, value + step);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    
    // Allow empty input while typing
    setInputValue(inputVal);
    
    // Convert to number if valid
    const numValue = parseInt(inputVal);
    if (!isNaN(numValue) && numValue >= minValue && numValue <= maxValue) {
      onChange(numValue);
    }
  };

  const handleBlur = () => {
    // Reset to valid value on blur
    if (inputValue === '' || typeof inputValue === 'string') {
      setInputValue(value || defaultValue);
    } else if (inputValue < minValue) {
      setInputValue(minValue);
      onChange(minValue);
    } else if (inputValue > maxValue) {
      setInputValue(maxValue);
      onChange(maxValue);
    }
  };

  return (
    <div className={`mb-6 ${className}`}>
      <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">{label}:</label>
      <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-2">
        <button 
          onClick={handleDecrement}
          className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg mr-2 transition-colors"
          aria-label="Decrease value"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>
        
        <input
          type="number"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          min={minValue}
          max={maxValue}
          step={step}
          className="w-16 h-10 text-center bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-600 rounded font-medium text-gray-800 dark:text-gray-200 text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          aria-label={label}
        />
        
        <button 
          onClick={handleIncrement}
          className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg ml-2 transition-colors"
          aria-label="Increase value"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
        
        {suffix && <span className="ml-4 text-gray-700 dark:text-gray-300">{suffix}</span>}
      </div>
    </div>
  );
} 