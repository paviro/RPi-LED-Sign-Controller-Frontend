import { useState, useEffect, useRef } from 'react';

interface BrightnessControlProps {
  brightness: number;
  onChange: (value: number) => void;
}

/**
 * BrightnessControl component allows users to adjust display brightness
 * using a slider control with visual feedback
 */
export default function BrightnessControl({ brightness, onChange }: BrightnessControlProps) {
  const [value, setValue] = useState(brightness);
  const sliderRef = useRef<HTMLInputElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  
  // Sync local state with props when brightness changes externally
  useEffect(() => {
    setValue(brightness);
  }, [brightness]);
  
  // Connect to brightness events API using SSE
  useEffect(() => {
    // Create EventSource for real-time brightness updates
    const eventSource = new EventSource('/api/events/brightness');
    eventSourceRef.current = eventSource;
    
    // Listen for brightness updates from the server
    eventSource.addEventListener('message', (event) => {
      try {
        const brightnessData = JSON.parse(event.data);
        if (typeof brightnessData.brightness === 'number') {
          setValue(brightnessData.brightness);
        }
      } catch (error) {
        console.error('Error parsing brightness event data:', error);
      }
    });
    
    // Handle connection status
    eventSource.addEventListener('open', () => {
      console.log('Brightness SSE connection established');
    });
    
    eventSource.addEventListener('error', (event) => {
      console.error('Brightness SSE connection error:', event);
    });
    
    // Clean up the connection when component unmounts
    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, []);
  
  // Update slider fill visual based on current value
  useEffect(() => {
    if (sliderRef.current) {
      const percentage = (Number(value) / 100) * 100;
      sliderRef.current.style.background = `linear-gradient(to right, #4F46E5 0%, #4F46E5 ${percentage}%, #EEF2FF ${percentage}%, #EEF2FF 100%)`;
    }
  }, [value]);
  
  // Handle user interaction with the slider
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    setValue(newValue);
    
    // Apply visual feedback for slider position
    if (sliderRef.current) {
      const percentage = (newValue / 100) * 100;
      sliderRef.current.style.background = `linear-gradient(to right, #4F46E5 0%, #4F46E5 ${percentage}%, #EEF2FF ${percentage}%, #EEF2FF 100%)`;
    }
    
    // Notify parent component of the brightness change
    onChange(newValue);
  };
  
  return (
    <div className="brightness-control">
      {/* Header with icon and description */}
      <div className="flex items-center mb-6">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Display Brightness</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Adjust the intensity of your LED display</p>
        </div>
      </div>
      
      {/* Slider control with min/max icons and value display */}
      <div className="slider-container flex items-center my-6 py-2">
        {/* Low brightness icon */}
        <span className="text-gray-500 dark:text-gray-400 mr-5">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-opacity hover:opacity-80 hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </span>
        
        {/* Slider input with colored fill based on value */}
        <div className="flex-grow relative h-3 flex items-center">
          <input
            ref={sliderRef}
            type="range"
            min="0"
            max="100"
            value={value}
            onChange={handleChange}
            className="appearance-none cursor-pointer absolute inset-0 h-3 rounded-lg transition-all hover:h-4 focus:h-4 bg-gradient-to-r from-indigo-600 to-indigo-600"
          />
        </div>
        
        {/* High brightness icon */}
        <span className="text-gray-500 dark:text-gray-400 ml-5">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transition-opacity hover:opacity-80 hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </span>
        
        {/* Numeric brightness value display */}
        <div className="ml-7">
          <div className="bg-indigo-600 text-white px-3 py-1.5 rounded-full font-semibold shadow-md transition-all hover:translate-y-[-1px] hover:shadow-lg">
            {value}%
          </div>
        </div>
      </div>
    </div>
  );
} 