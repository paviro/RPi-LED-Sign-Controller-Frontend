'use client';

import { useState, useEffect } from 'react';
import ColorPicker from './ColorPicker';

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
  const [activeColorIndex, setActiveColorIndex] = useState(0);
  const [editMode, setEditMode] = useState(false); // For mobile editing mode
  
  // Handle window resize to exit edit mode on larger screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && editMode) { // 768px is the md breakpoint in Tailwind
        setEditMode(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [editMode]);
  
  // Effect options
  const effects = [
    { id: 'none', label: 'None', icon: '❌' },
    { id: 'rainbow', label: 'Rainbow', icon: '🌈' },
    { id: 'pulse', label: 'Pulse', icon: '💓' },
    { id: 'sparkle', label: 'Sparkle', icon: '✨' },
    { id: 'gradient', label: 'Gradient | Color', icon: '🎨' }
  ];
  
  /**
   * Converts RGB color values to hexadecimal format
   * @param r Red value (0-255)
   * @param g Green value (0-255)
   * @param b Blue value (0-255)
   * @returns Hex color string (e.g. #FF5500)
   */
  const rgbToHex = (r: number, g: number, b: number): string => {
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };
  
  // Check if this effect needs colors
  const needsColorPickers = ['pulse', 'sparkle', 'gradient'].includes(selectedEffect);
  
  // Generate a linear gradient preview based on the current colors
  const getGradientPreview = () => {
    if (gradientColors.length === 0) return 'transparent';
    if (gradientColors.length === 1) {
      const color = gradientColors[0];
      return rgbToHex(color[0], color[1], color[2]);
    }
    
    const stops = gradientColors.map((color, index) => {
      const percentage = (index / (gradientColors.length - 1)) * 100;
      return `${rgbToHex(color[0], color[1], color[2])} ${percentage}%`;
    });
    
    return `linear-gradient(to right, ${stops.join(', ')})`;
  };
  
  // Toggle edit mode (for mobile)
  const toggleEditMode = () => {
    setEditMode(!editMode);
  };
  
  // Handle adding a new random color and automatically select it
  const handleAddColor = () => {
    // Call the parent's add color function
    onAddGradientColor();
    
    // Set a timeout to ensure we don't update state during rendering
    setTimeout(() => {
      setActiveColorIndex(gradientColors.length);
    }, 0);
  };
  
  // Ensure active index is valid after color removal
  useEffect(() => {
    // Only adjust if activeColorIndex is out of bounds
    if (activeColorIndex >= gradientColors.length && gradientColors.length > 0) {
      // Use requestAnimationFrame to batch updates and avoid render conflicts
      requestAnimationFrame(() => {
        setActiveColorIndex(prev => {
          if (prev >= gradientColors.length) {
            return gradientColors.length - 1;
          }
          return prev;
        });
      });
    }
    // Dependencies are limited to gradientColors.length to prevent infinite update loops
  }, [gradientColors.length, activeColorIndex]);
  
  /**
   * Update a specific gradient color in the collection
   * Only triggers parent update when the color actually changes
   */
  const handleGradientColorEdit = (index: number, color: [number, number, number]) => {
    // Only update if the color actually changed
    if (
      gradientColors[index][0] !== color[0] ||
      gradientColors[index][1] !== color[1] ||
      gradientColors[index][2] !== color[2]
    ) {
      const newGradientColors = [...gradientColors];
      newGradientColors[index] = color;
      onGradientColorChange(index, color);
    }
  };
  
  return (
    <div>
      <div className="effect-options grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-5">
        {effects.map(effect => (
          <button
            key={effect.id}
            className={`effect-option flex flex-col items-center p-4 ${
              selectedEffect === effect.id 
                ? 'border-2 border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                : 'border border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 bg-white dark:bg-gray-800'
            } rounded-xl transition-all shadow-sm hover:shadow`}
            onClick={() => onEffectChange(effect.id)}
          >
            <div className="effect-option-icon text-2xl mb-2">
              {effect.icon}
            </div>
            <span className="text-sm font-medium">{effect.label}</span>
          </button>
        ))}
      </div>
      
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
          
          {/* Gradient preview with enhanced styling */}
          {selectedEffect === 'gradient' && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-100 dark:border-gray-700">
              <h5 className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Preview</h5>
              <div className="h-8 rounded-lg shadow-inner overflow-hidden" style={{ background: getGradientPreview() }}></div>
            </div>
          )}
          
          {gradientColors.length > 0 ? (
            <div className="space-y-5">
              {/* Color swatch palette */}
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
                        onClick={() => {
                          const newIndex = index > 0 ? index - 1 : 0;
                          // Adjust active index if needed, before removing the color
                          if (activeColorIndex === index) {
                            setActiveColorIndex(newIndex);
                          } else if (activeColorIndex > index) {
                            setActiveColorIndex(activeColorIndex - 1);
                          }
                          
                          // Remove the color
                          onRemoveGradientColor(index);
                        }}
                        className="absolute inset-0 rounded-lg"
                        aria-label={`Remove color ${index + 1}`}
                      ></button>
                    )}
                    
                    {/* Desktop hover delete button - only show when not in edit mode */}
                    {!editMode && gradientColors.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          
                          const newIndex = index > 0 ? index - 1 : 0;
                          // Adjust active index if needed, before removing the color
                          if (activeColorIndex === index) {
                            setActiveColorIndex(newIndex);
                          } else if (activeColorIndex > index) {
                            setActiveColorIndex(activeColorIndex - 1);
                          }
                          
                          // Remove the color
                          onRemoveGradientColor(index);
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
              
              {/* Color editor */}
              {!editMode && (
                <div className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Selected Color:</h5>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Color {activeColorIndex + 1} of {gradientColors.length}
                    </div>
                  </div>
                  <ColorPicker
                    color={gradientColors[activeColorIndex]}
                    onChange={(color) => handleGradientColorEdit(activeColorIndex, color)}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="empty-gradient-message p-5 bg-gray-50 dark:bg-gray-900/30 rounded-lg text-center text-gray-600 dark:text-gray-400 mb-3 border border-dashed border-gray-300 dark:border-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              <p>
                {selectedEffect === 'pulse' ? 
                 'No colors added yet. Default will use text color. Click "Add Color" to add colors.' : 
                 selectedEffect === 'sparkle' ? 
                 'No colors added yet. Default will use text color. Click "Add Color" to add colors.' :
                 'No colors added yet. Click "Add Color" to add colors.'}
              </p>
            </div>
          )}
          
          {/* Mobile helper text with clearer instructions */}
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