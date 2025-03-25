'use client';

import React from 'react';
import { useGradientColors } from './hooks/useGradientColors';
import EffectOptions from './components/EffectOptions';
import GradientPreview from './components/GradientPreview';
import ColorSwatches from './components/ColorSwatches';
import ColorEditor from './components/ColorEditor';

interface BorderEffectSelectorProps {
  selectedEffect: string;
  onEffectChange: (effect: string) => void;
  gradientColors: Array<[number, number, number]>;
  onGradientColorChange: (index: number, color: [number, number, number]) => void;
  onAddGradientColor: () => void;
  onRemoveGradientColor: (index: number) => void;
}

export default function BorderEffectSelector({
  selectedEffect,
  onEffectChange,
  gradientColors,
  onGradientColorChange,
  onAddGradientColor,
  onRemoveGradientColor
}: BorderEffectSelectorProps) {
  // Use our custom hook for gradient color management
  const {
    activeColorIndex,
    setActiveColorIndex,
    editMode,
    toggleEditMode,
    handleAddColor,
    handleGradientColorEdit,
    handleRemoveColor
  } = useGradientColors(
    gradientColors,
    onGradientColorChange,
    onAddGradientColor,
    onRemoveGradientColor
  );
  
  // Check if this effect needs colors
  const needsColorPickers = ['pulse', 'sparkle', 'gradient'].includes(selectedEffect);
  
  return (
    <div className="mb-8 border-t border-gray-200 dark:border-gray-700 pt-8">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Border Effect</h3>
      {/* Effect selector buttons */}
      <EffectOptions 
        selectedEffect={selectedEffect} 
        onEffectChange={onEffectChange} 
      />
      
      {needsColorPickers && (
        <div className="gradient-colors mt-6 p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-gray-800 dark:text-gray-200 flex items-center">
              <span className="p-1 bg-indigo-100 dark:bg-indigo-900/30 rounded mr-2 text-indigo-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-14a2 2 0 10-4 0v1a2 2 0 104 0V2zm3 0a2 2 0 10-4 0v1a2 2 0 104 0V2zm3 0a2 2 0 10-4 0v1a2 2 0 104 0V2z" />
                </svg>
              </span>
              {selectedEffect === 'gradient' ? 'Gradient Colors' : 
               selectedEffect === 'pulse' ? 'Pulse Colors' : 
               'Sparkle Colors'}
            </h4>
            
            <div className="flex space-x-2">
              {/* Edit mode toggle button for mobile */}
              {gradientColors.length > 1 && (
                <button 
                  onClick={toggleEditMode}
                  className={`md:hidden px-3 py-1.5 rounded-lg text-sm font-medium flex items-center transition-colors ${
                    editMode 
                      ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800' 
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {editMode ? (
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Done
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      Edit
                    </span>
                  )}
                </button>
              )}
              
              <button 
                onClick={handleAddColor}
                className="add-btn bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Color
              </button>
            </div>
          </div>
          
          {/* Gradient preview - only for gradient effect */}
          {selectedEffect === 'gradient' && (
            <GradientPreview gradientColors={gradientColors} />
          )}
          
          <div className="space-y-5">
            {/* Color swatches palette */}
            <ColorSwatches 
              gradientColors={gradientColors}
              activeColorIndex={activeColorIndex}
              editMode={editMode}
              setActiveColorIndex={setActiveColorIndex}
              onRemoveColor={handleRemoveColor}
            />
            
            {/* Color editor */}
            {!editMode && gradientColors.length > 0 && (
              <ColorEditor 
                gradientColors={gradientColors}
                activeColorIndex={activeColorIndex}
                onColorChange={handleGradientColorEdit}
              />
            )}
          </div>
          
          {/* Mobile helper text */}
          {gradientColors.length > 1 && !editMode && (
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 md:hidden text-center py-2 bg-gray-50 dark:bg-gray-900/10 rounded-md">
              Tap the &quot;Edit&quot; button above to remove colors
            </div>
          )}
          
          {/* Edit mode instruction */}
          {editMode && (
            <div className="mt-3 text-xs text-center py-2 bg-red-50 dark:bg-red-900/10 text-red-500 dark:text-red-400 rounded-md">
              Tap on a color to remove it • Tap &quot;Done&quot; when finished
            </div>
          )}
        </div>
      )}
    </div>
  );
} 