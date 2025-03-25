'use client';

import ScrollSpeedSelector from './components/ScrollSpeedSelector';
import NumberInputControl from '../../common/NumberInputControl';

interface ScrollControlsProps {
  isScrollEnabled: boolean;
  onScrollChange: (scroll: boolean) => void;
  scrollSpeed: number;
  onSpeedChange: (speed: number) => void;
  duration: number;
  onDurationChange: (duration: number) => void;
  repeatCount: number;
  onRepeatCountChange: (repeatCount: number) => void;
}

/**
 * Component for managing scroll-related controls
 * Shows either scroll speed + repeat count (when scrolling) or static duration (when not scrolling)
 */
export default function ScrollControls({
  isScrollEnabled,
  onScrollChange,
  scrollSpeed,
  onSpeedChange,
  duration,
  onDurationChange,
  repeatCount,
  onRepeatCountChange
}: ScrollControlsProps) {
  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 my-6">
      <div className="flex items-center mb-5">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            id="scroll"
            name="scroll"
            checked={isScrollEnabled}
            onChange={(e) => onScrollChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
          <span className="ml-3 font-medium text-gray-800 dark:text-gray-200">Scroll Text</span>
        </label>
        <div className="ml-2 text-sm text-gray-500 dark:text-gray-400">
          (Scrolling text moves across the display)
        </div>
      </div>

      {/* Scroll-specific controls */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isScrollEnabled ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 invisible'}`}>
        <ScrollSpeedSelector
          speed={scrollSpeed}
          onSpeedChange={onSpeedChange}
        />

        <NumberInputControl
          label="Number of Repeats"
          value={repeatCount}
          onChange={onRepeatCountChange}
          suffix="times"
          minValue={1}
          defaultValue={1}
        />
      </div>

      {/* Static duration control */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${!isScrollEnabled ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 invisible'}`}>
        <NumberInputControl
          label="Duration (seconds)"
          value={duration}
          onChange={onDurationChange}
          suffix="seconds"
          minValue={1}
          defaultValue={10}
        />
      </div>
    </div>
  );
} 