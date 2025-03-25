'use client';

import { RgbColorPicker } from 'react-colorful';
import { useState, useEffect, useRef } from 'react';
import { rgbToHex } from '../../../utils/colorUtils';
import { RGBColor } from '../../../types';

/**
 * ColorPicker component props
 * @param color - RGB color values as a tuple [r, g, b] (0-255 for each channel)
 * @param onChange - Callback function when color changes
 */
interface ColorPickerProps {
  color: RGBColor;
  onChange: (color: RGBColor) => void;
}

/**
 * A reusable color picker component that provides:
 * - Visual RGB color picker
 * - Color preview
 * - Common color presets
 * 
 * Handles the conversion between array format [r,g,b] and object format {r,g,b}
 * while preventing update loops between parent and child components.
 */
export default function ColorPicker({ color, onChange }: ColorPickerProps) {
  // Convert app's [r,g,b] format to library's {r,g,b} format
  const [pickerColor, setPickerColor] = useState({ r: color[0], g: color[1], b: color[2] });
  const isUpdatingRef = useRef(false);
  
  // Common color presets
  const colorPresets: RGBColor[] = [
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
  
  // Update internal state when prop changes
  useEffect(() => {
    if (
      !isUpdatingRef.current && 
      (color[0] !== pickerColor.r || color[1] !== pickerColor.g || color[2] !== pickerColor.b)
    ) {
      setPickerColor({ r: color[0], g: color[1], b: color[2] });
    }
  }, [color, pickerColor]);
  
  // Safely update color with change tracking
  const updateColor = (newColor: RGBColor | { r: number, g: number, b: number }) => {
    isUpdatingRef.current = true;
    
    try {
      // Convert object format to array format if needed
      const colorArray: RGBColor = Array.isArray(newColor) 
        ? newColor 
        : [newColor.r, newColor.g, newColor.b];
        
      // Update picker state
      if (!Array.isArray(newColor)) {
        setPickerColor(newColor);
      } else {
        setPickerColor({ r: newColor[0], g: newColor[1], b: newColor[2] });
      }
      
      // Notify parent
      onChange(colorArray);
    } finally {
      // Reset flag after a short delay
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
            color={pickerColor} 
            onChange={updateColor}
          />
        </div>
        
        <div className="flex flex-col space-y-5">
          {/* Current color preview with RGB values */}
          <div className="color-preview-wrapper flex items-center p-2 bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
            <div 
              className="color-preview w-12 h-12 border rounded-md shadow-sm mr-3 transition-transform hover:scale-105"
              style={{ backgroundColor: rgbToHex(pickerColor.r, pickerColor.g, pickerColor.b) }}
            ></div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <div className="font-medium mb-1">RGB:</div>
              <div>{pickerColor.r}, {pickerColor.g}, {pickerColor.b}</div>
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
                  style={{ backgroundColor: rgbToHex(preset) }}
                  onClick={() => updateColor(preset)}
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