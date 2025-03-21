'use client';

import { RgbColorPicker } from 'react-colorful';
import { useState, useEffect, useRef } from 'react';

/**
 * ColorPicker component props
 * @param color - RGB color values as a tuple [r, g, b]
 * @param onChange - Callback function when color changes
 */
interface ColorPickerProps {
  color: [number, number, number];
  onChange: (color: [number, number, number]) => void;
}

export default function ColorPicker({ color, onChange }: ColorPickerProps) {
  // Convert array format [r,g,b] to object format {r,g,b} for react-colorful
  const [rgbColor, setRgbColor] = useState({ r: color[0], g: color[1], b: color[2] });
  
  // Ref to prevent infinite update cycles between parent and child state
  const isUpdatingRef = useRef(false);
  
  // Common color presets for quick selection
  const colorPresets: Array<[number, number, number]> = [
    [255, 255, 255], // White
    [255, 0, 0],     // Red
    [0, 255, 0],     // Green
    [0, 0, 255],     // Blue
    [255, 255, 0],   // Yellow
    [255, 0, 255],   // Magenta
    [0, 255, 255],   // Cyan
    [255, 165, 0],   // Orange
    [128, 0, 128]    // Purple
  ];
  
  // Synchronize internal state with external props
  useEffect(() => {
    // Only update if the color values actually changed
    if (color[0] !== rgbColor.r || color[1] !== rgbColor.g || color[2] !== rgbColor.b) {
      if (!isUpdatingRef.current) {
        setRgbColor({ r: color[0], g: color[1], b: color[2] });
      }
    }
  }, [color, rgbColor]);
  
  /**
   * Converts RGB values to a hex color string
   * @returns Hex color code with # prefix
   */
  const rgbToHex = (r: number, g: number, b: number): string => {
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };
  
  // Handle color changes from the color picker component
  const handleColorChange = (newColor: { r: number; g: number; b: number }) => {
    isUpdatingRef.current = true;
    
    // Update internal state
    setRgbColor(newColor);
    
    // Notify parent component with the new color values
    try {
      onChange([newColor.r, newColor.g, newColor.b]);
    } finally {
      // Reset the flag after a short delay to allow state to settle
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  };
  
  // Handle selection of a preset color
  const selectPreset = (preset: [number, number, number]) => {
    isUpdatingRef.current = true;
    
    setRgbColor({ r: preset[0], g: preset[1], b: preset[2] });
    
    try {
      onChange(preset);
    } finally {
      // Reset the flag after a short delay to allow state to settle
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  };
  
  return (
    <div className="color-picker m-2 mt-5 rounded-xl overflow-visible">
      <div className="flex flex-col md:flex-row gap-4 mb-4 ">
        {/* Main color picker area */}
        <div className="flex-1">
          <RgbColorPicker 
            color={rgbColor} 
            onChange={handleColorChange}
          />
        </div>
        
        <div className="flex flex-col space-y-5">
          {/* Current color preview with RGB values */}
          <div className="color-preview-wrapper flex items-center p-2 bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
            <div 
              className="color-preview w-12 h-12 border rounded-md shadow-sm mr-3 transition-transform hover:scale-105"
              style={{ backgroundColor: rgbToHex(rgbColor.r, rgbColor.g, rgbColor.b) }}
            ></div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <div className="font-medium mb-1">RGB:</div>
              <div>{rgbColor.r}, {rgbColor.g}, {rgbColor.b}</div>
            </div>
          </div>
          
          {/* Preset color buttons */}
          <div className="color-presets">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Presets:</h4>
            <div className="flex flex-wrap gap-2">
              {colorPresets.map((preset, index) => (
                <button
                  key={index}
                  className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm hover:scale-110 transition-transform hover:shadow"
                  style={{ backgroundColor: rgbToHex(preset[0], preset[1], preset[2]) }}
                  onClick={() => selectPreset(preset)}
                  title={`RGB: ${preset[0]}, ${preset[1]}, ${preset[2]}`}
                ></button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 