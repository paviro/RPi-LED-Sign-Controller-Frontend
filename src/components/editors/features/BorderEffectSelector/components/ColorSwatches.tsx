import React from 'react';
import { rgbToHex } from '../../../../../utils/colorUtils';

interface ColorSwatchesProps {
  gradientColors: Array<[number, number, number]>;
  activeColorIndex: number;
  editMode: boolean;
  setActiveColorIndex: (index: number) => void;
  onRemoveColor: (index: number) => void;
}

export default function ColorSwatches({
  gradientColors,
  activeColorIndex,
  editMode,
  setActiveColorIndex,
  onRemoveColor
}: ColorSwatchesProps) {
  return (
    <div className="flex flex-wrap gap-3 p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-700">
      {gradientColors.map((color, index) => (
        <div 
          key={index} 
          className={`relative group ${editMode ? 'cursor-default' : 'cursor-pointer'}`}
        >
          {/* The swatch itself - always visible */}
          <div 
            onClick={() => !editMode && setActiveColorIndex(index)}
            className={`w-14 h-14 rounded-lg shadow-sm border-2 transition-transform ${
              activeColorIndex === index && !editMode
                ? 'border-indigo-500 scale-110' 
                : 'border-gray-300 dark:border-gray-600 group-hover:scale-105'
            }`}
            style={{ backgroundColor: rgbToHex(color[0], color[1], color[2]) }}
          >
            {/* Selected checkmark at bottom left */}
            {activeColorIndex === index && !editMode && (
              <div className="absolute bottom-1 left-1 bg-indigo-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            
            {/* Gray X icon in edit mode - directly on the color with no text */}
            {editMode && gradientColors.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-gray-600 bg-opacity-30 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5 text-gray-200" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor" 
                      strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
            )}
          </div>
          
          {/* Clickable area for edit mode */}
          {editMode && gradientColors.length > 1 && (
            <button
              onClick={() => onRemoveColor(index)}
              className="absolute inset-0 rounded-lg"
              aria-label={`Remove color ${index + 1}`}
            ></button>
          )}
          
          {/* Desktop hover delete button - only show when not in edit mode */}
          {!editMode && gradientColors.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveColor(index);
              }}
              className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center opacity-0 md:group-hover:opacity-100 transition-opacity shadow-sm"
              title="Remove color"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
} 