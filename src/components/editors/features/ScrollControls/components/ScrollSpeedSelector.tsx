'use client';

import { useState } from 'react';

/**
 * Available speed presets
 */
export type SpeedPreset = 'slow' | 'normal' | 'fast' | 'custom';

/**
 * Determines which preset a numeric speed value corresponds to
 * @param speed - Numeric speed value in pixels per second
 * @returns Matching preset or 'custom' if no match
 */
export function getPresetFromSpeed(speed: number): SpeedPreset {
  if (speed === 35) return 'slow';
  if (speed === 50) return 'normal';
  if (speed === 150) return 'fast';
  return 'custom';
}

/**
 * Gets the numeric speed value for a given preset
 * @param preset - Speed preset value
 * @returns Numeric speed value in pixels per second
 */
export function getSpeedFromPreset(preset: SpeedPreset): number {
  switch (preset) {
    case 'slow': return 35;
    case 'normal': return 50;
    case 'fast': return 150;
    default: return 50; // Default to normal speed for custom
  }
}

interface ScrollSpeedSelectorProps {
  speed: number;
  onSpeedChange: (speed: number) => void;
  onPresetChange?: (preset: SpeedPreset) => void;
}

/**
 * A subcomponent of ScrollControls for selecting scroll speed
 * Provides both preset buttons and a custom slider
 */
export default function ScrollSpeedSelector({
  speed,
  onSpeedChange,
  onPresetChange
}: ScrollSpeedSelectorProps) {
  // Initialize with the correct preset based on the provided speed
  const [speedPreset, setSpeedPreset] = useState<SpeedPreset>(() => 
    getPresetFromSpeed(speed)
  );

  /**
   * Sets speed value based on preset selection
   */
  const setSpeedByPreset = (preset: SpeedPreset) => {
    // Use the utility function for consistency
    const newSpeed = preset === 'custom' ? speed : getSpeedFromPreset(preset);
    
    // Update the speed
    onSpeedChange(newSpeed);
    
    // Update the preset state
    setSpeedPreset(preset);
    
    // Notify parent component if callback provided
    if (onPresetChange) {
      onPresetChange(preset);
    }
  };

  return (
    <div className="mb-6">
      <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">Scroll Speed:</label>
      <div className="grid grid-cols-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
        <button 
          onClick={() => setSpeedByPreset('slow')}
          className={`py-3 text-center transition-colors ${speedPreset === 'slow' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
        >
          Slow
        </button>
        <button 
          onClick={() => setSpeedByPreset('normal')}
          className={`py-3 text-center transition-colors ${speedPreset === 'normal' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
        >
          Normal
        </button>
        <button 
          onClick={() => setSpeedByPreset('fast')}
          className={`py-3 text-center transition-colors ${speedPreset === 'fast' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
        >
          Fast
        </button>
        <button 
          onClick={() => setSpeedByPreset('custom')}
          className={`py-3 text-center transition-colors ${speedPreset === 'custom' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
        >
          Custom
        </button>
      </div>
      
      {/* Only show slider for custom with enhanced animation */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${speedPreset === 'custom' ? 'max-h-24 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
        <div className="flex items-center gap-4 h-10">
          <div className="relative flex-grow flex items-center">
            <input
              type="range"
              min="10"
              max="250"
              value={speed}
              onChange={(e) => {
                // Get the value
                const value = parseInt(e.target.value);
                
                // Update the CSS variable for the track fill directly on the element
                const percentage = ((value - 10) / (250 - 10)) * 100;
                e.target.style.setProperty('--slider-value', `${percentage}%`);
                
                // Update the speed
                onSpeedChange(value);
                
                // Set preset to custom
                setSpeedPreset('custom');
                
                // Notify parent if callback provided
                if (onPresetChange) {
                  onPresetChange('custom');
                }
              }}
              style={{ '--slider-value': `${(speed - 10) / (250 - 10) * 100}%` } as React.CSSProperties}
              className="enhanced-slider appearance-none cursor-pointer w-full"
            />
          </div>
          <div className="brightness-value whitespace-nowrap">
            {speed} px/sec
          </div>
        </div>
      </div>
    </div>
  );
} 