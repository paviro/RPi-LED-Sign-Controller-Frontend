'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  fetchPlaylistItem, 
  createPlaylistItem, 
  updatePlaylistItem,
  startPreviewMode, 
  exitPreviewMode, 
  pingPreviewMode 
} from '../../../lib/api';
import TextEditor from '../features/RichTextEditor/RichTextEditor';
import { PlaylistItem, ContentType } from '../../../types';
import BorderEffectSelector from '../features/BorderEffectSelector/BorderEffectSelector';
import EditorLayout from '../common/EditorLayout';
import { debounce } from 'lodash';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import StatusMessage from '../../common/StatusMessage';

interface TextInputEditorProps {
  itemId: string | null;
  onBack: () => void;
}

export default function TextInputEditor({ itemId, onBack }: TextInputEditorProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: "error" | "success" | "info" } | null>(null);
  
  // State for tracking whether we're editing an existing item or creating a new one
  const [isNewItem, setIsNewItem] = useState(true);
  const [formData, setFormData] = useState<Partial<PlaylistItem>>({
    duration: 10,
    repeat_count: 1,
    border_effect: { None: null },
    content: {
      type: ContentType.Text,
      data: {
        type: 'Text',
        text: '',
        scroll: false,
        color: [255, 255, 255],
        speed: 50,
        text_segments: []
      }
    }
  });
  
  // Color management for text styling
  const [selectedColor, setSelectedColor] = useState<[number, number, number]>([255, 255, 255]);
  const [selectedBorderEffect, setSelectedBorderEffect] = useState<string>('none');
  
  // Track text segments with color formatting
  const [textSegments, setTextSegments] = useState<Array<{
    start: number;
    end: number;
    color?: [number, number, number];
    formatting?: {
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
    };
  }>>([]);
  
  // Speed preset management
  const [speedPreset, setSpeedPresetState] = useState<'slow' | 'normal' | 'fast' | 'custom'>('normal');
  
  // Function to generate a random vibrant color
  const getRandomColor = (): [number, number, number] => {
    // Generate colors with at least one channel at full intensity for vibrancy
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    
    // Ensure at least one channel is bright (>200) for more vibrant colors
    if (r < 200 && g < 200 && b < 200) {
      const brightChannel = Math.floor(Math.random() * 3);
      if (brightChannel === 0) return [255, g, b];
      if (brightChannel === 1) return [r, 255, b];
      return [r, g, 255];
    }
    
    return [r, g, b];
  };
  
  // Initialize with a random vibrant color instead of red
  const [gradientColors, setGradientColors] = useState<Array<[number, number, number]>>([
    getRandomColor()
  ]);

  // Add state to track if we're in preview mode
  const [previewActive, setPreviewActive] = useState(false);
  
  // Create a debounced version of the preview update function
  const updatePreview = useCallback((previewItem: Partial<PlaylistItem>) => {
    startPreviewMode(previewItem);
  }, []);
  
  // We'll use debouncing specifically for text changes
  const debouncedUpdatePreview = useRef(debounce(updatePreview, 50)).current;
  
  // Memoize the getBorderEffectObject function with useCallback
  const getBorderEffectObject = useCallback(() => {
    switch (selectedBorderEffect) {
      case 'none':
        return { None: null };
      case 'rainbow':
        return { Rainbow: null };
      case 'pulse':
        return { Pulse: { colors: gradientColors } };
      case 'sparkle':
        return { Sparkle: { colors: gradientColors } };
      case 'gradient':
        return { Gradient: { colors: gradientColors } };
      default:
        return { None: null };
    }
  }, [selectedBorderEffect, gradientColors]);
  
  // Memoize the getPreviewItem function with useCallback
  const getPreviewItem = useCallback((): Partial<PlaylistItem> => {
    return {
      duration: formData.duration || 10,
      repeat_count: formData.repeat_count || 1,
      border_effect: getBorderEffectObject(),
      content: {
        type: ContentType.Text,
        data: {
          type: 'Text',
          text: formData.content?.data?.text || 'Edit Mode',
          scroll: formData.content?.data?.scroll || false,
          color: selectedColor,
          speed: formData.content?.data?.speed || 50,
          text_segments: textSegments.length > 0 ? textSegments : undefined
        }
      }
    };
  }, [
    formData.duration,
    formData.repeat_count,
    formData.content?.data?.text,
    formData.content?.data?.scroll,
    formData.content?.data?.speed,
    selectedColor,
    getBorderEffectObject,
    textSegments
  ]);
  
  // Keep the initialization ref
  const previewInitialized = useRef(false);

  // Add an interval ref to store the ping interval
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize preview mode and set up ping interval
  useEffect(() => {
    // Start preview mode with current settings and configure ping
    const setupPreview = async () => {
      try {
        const initialPreview = getPreviewItem();
        await startPreviewMode(initialPreview);
        setPreviewActive(true);
        previewInitialized.current = true;
        
        // Start the ping interval
        startPingInterval();
      } catch (error) {
        // Include error details in the status message
        setStatus({
          message: `Failed to start preview mode: ${error instanceof Error ? error.message : 'Unknown error'}`,
          type: 'error'
        });
      }
    };

    // Configure ping interval to keep preview session alive
    const startPingInterval = () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      
      // Send a ping every 4 seconds (server timeout is 5 seconds)
      pingIntervalRef.current = setInterval(() => {
        pingPreviewMode();
      }, 4000);
    };

    // Only initialize once
    if (!previewInitialized.current) {
      setupPreview();
    }
    
    // Cleanup on unmount
    return () => {
      // Stop ping interval
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      
      // Exit preview mode on unmount if it was initialized
      if (previewInitialized.current) {
        exitPreviewMode();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);  // Run only on component mount/unmount

  // Split update effect for regular updates vs text changes to utilize debouncing
  useEffect(() => {
    // Don't update until preview is initialized and loading is complete
    if (!previewInitialized.current || loading) return;
    
    // Use debounced update for text changes for better performance
    const previewItem = getPreviewItem();
    debouncedUpdatePreview(previewItem);
    
  }, [formData.content?.data?.text, loading, debouncedUpdatePreview, getPreviewItem]);

  // This effect handles immediate updates for UI controls and styles
  useEffect(() => {
    // Don't update until preview is initialized and loading is complete
    if (!previewInitialized.current || loading) return;
    
    // Get the preview item
    const previewItem = getPreviewItem();
    
    // Update the preview immediately for visual elements
    updatePreview(previewItem);
    
  }, [
    selectedColor,
    selectedBorderEffect,
    gradientColors,
    formData.content?.data?.scroll,
    formData.content?.data?.speed,
    formData.duration,
    formData.repeat_count,
    loading,
    updatePreview,
    getPreviewItem
  ]);
  
  // Handle navigation back to playlist view
  const handleBack = () => {
    // Stop ping interval
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    
    // Let unmount cleanup handle exiting preview mode
    setPreviewActive(false);
    onBack();
  };

  // Add a new random color to the gradient
  const handleAddGradientColor = () => {
    const newColor = getRandomColor();
    setGradientColors(prev => [...prev, newColor]);
  };

  // Load item data when itemId changes - update to remove old schema references
  useEffect(() => {
    const loadItem = async () => {
      setLoading(true);
      
      if (itemId) {
        try {
          const item = await fetchPlaylistItem(itemId);
          setFormData(item);
          
          // Set the selected color from the item's content
          if (item.content?.data?.color) {
            setSelectedColor(item.content.data.color);
          }
          
          // Determine speed preset based on the loaded speed value
          const speed = item.content?.data?.speed;
          if (speed === 35) {
            setSpeedPresetState('slow');
          } else if (speed === 50) {
            setSpeedPresetState('normal');
          } else if (speed === 150) {
            setSpeedPresetState('fast');
          } else {
            setSpeedPresetState('custom');
          }
          
          // Extract and normalize border effect type
          if (item.border_effect) {
            const effectType = Object.keys(item.border_effect)[0];
            if (effectType) {
              const normalizedEffectType = effectType.toLowerCase();
              setSelectedBorderEffect(normalizedEffectType);
            } else {
              setSelectedBorderEffect('none');
            }
            
            // Load gradient colors if present in the border effect
            const effectValue = Object.values(item.border_effect)[0];
            if (effectValue && typeof effectValue === 'object' && effectValue !== null && 'colors' in effectValue) {
              if (!effectValue.colors || effectValue.colors.length === 0) {
                setGradientColors([item.content?.data?.color || [255, 0, 0]]);
              } else {
                setGradientColors(effectValue.colors as Array<[number, number, number]>);
              }
            } else {
              setGradientColors([item.content?.data?.color || [255, 0, 0]]);
            }
          } else {
            setSelectedBorderEffect('none');
          }
          
          // Load text segments if they exist
          if (item.content?.data?.text_segments && item.content.data.text_segments.length > 0) {
            setTextSegments(item.content.data.text_segments);
          }
          
          setIsNewItem(false);
        } catch (error) {
          setStatus({
            message: `Error loading item: ${error instanceof Error ? error.message : 'Unknown error'}`,
            type: 'error'
          });
        }
      }
      
      setLoading(false);
    };
    
    loadItem();
  }, [itemId]);
  
  // Update the global text color
  const handleColorChange = (color: [number, number, number]) => {
    // Only update if the color actually changed
    if (
      selectedColor[0] !== color[0] ||
      selectedColor[1] !== color[1] ||
      selectedColor[2] !== color[2]
    ) {
      setSelectedColor(color);
      setFormData(prev => ({
        ...prev,
        content: {
          ...prev.content!,
          data: {
            ...prev.content!.data,
            color: color
          }
        }
      }));
    }
  };
  
  // Handle updates to text segments
  const handleTextSegmentsChange = (segments: Array<{
    start: number; 
    end: number; 
    color?: [number, number, number];
    formatting?: {
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
    };
  }>) => {
    setTextSegments(segments);
  };
  
  // Handle border effect selection - update directly
  const handleBorderEffectChange = (effect: string) => {
    setSelectedBorderEffect(effect);
    
    // Immediately update preview for border effect changes
    if (previewActive && !loading) {
      // Force immediate update with the new effect
      const updatedItem = {
        ...getPreviewItem(),
        border_effect: (function() {
          switch (effect) {
            case 'none': return { None: null };
            case 'rainbow': return { Rainbow: null };
            case 'pulse': return { Pulse: { colors: gradientColors } };
            case 'sparkle': return { Sparkle: { colors: gradientColors } };
            case 'gradient': return { Gradient: { colors: gradientColors } };
            default: return { None: null };
          }
        })()
      };
      updatePreview(updatedItem);
    }
  };
  
  // Remove a color from the gradient
  const handleRemoveGradientColor = (index: number) => {
    // Maintain at least one color in the gradient
    if (gradientColors.length <= 1) return;
    
    setGradientColors(prev => prev.filter((_, i) => i !== index));
  };
  
  // Ensure we always have at least one gradient color
  useEffect(() => {
    if (gradientColors.length === 0) {
      setGradientColors([[255, 0, 0]]);
    }
  }, [gradientColors.length]);
  
  // Save the current playlist item
  const handleSave = async () => {
    if (!formData.content?.data?.text || formData.content.data.text.trim() === '') {
      setStatus({ message: 'Please enter message text', type: 'error' });
      return;
    }
    
    setSaving(true);
    
    try {
      const borderEffect = getBorderEffectObject();
      
      // Create item data using the correct structure
      const itemToSave: Partial<PlaylistItem> = {
        duration: formData.duration || 10,
        repeat_count: formData.repeat_count || 1,
        border_effect: borderEffect,
        content: {
          type: ContentType.Text,
          data: {
            type: 'Text',
            text: formData.content?.data?.text || '',
            scroll: formData.content?.data?.scroll || false,
            color: selectedColor,
            speed: formData.content?.data?.speed || 50,
            text_segments: textSegments.length > 0 ? textSegments : undefined
          }
        }
      };
      
      if (isNewItem) {
        await createPlaylistItem(itemToSave);
      } else if (itemId) {
        // Make sure to include the ID in the data being sent
        await updatePlaylistItem(itemId, {
          ...itemToSave,
          id: itemId // Explicitly include the ID here
        });
      }
      
      // Stop ping interval
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      
      // Let unmount cleanup handle exiting preview mode
      setPreviewActive(false);
      onBack();
    } catch (error) {
      setStatus({
        message: `Error saving item: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Set speed value based on preset selection
  const setSpeedPreset = (preset: 'slow' | 'normal' | 'fast' | 'custom') => {
    switch (preset) {
      case 'slow':
        setFormData(prev => ({
          ...prev,
          content: {
            ...prev.content!,
            data: {
              ...prev.content!.data,
              speed: 35
            }
          }
        }));
        break;
      case 'normal':
        setFormData(prev => ({
          ...prev,
          content: {
            ...prev.content!,
            data: {
              ...prev.content!.data,
              speed: 50
            }
          }
        }));
        break;
      case 'fast':
        setFormData(prev => ({
          ...prev,
          content: {
            ...prev.content!,
            data: {
              ...prev.content!.data,
              speed: 150
            }
          }
        }));
        break;
      // Custom keeps the current value
    }
  };

  // Update both the preset UI state and actual speed value
  const handleSpeedPresetChange = (preset: 'slow' | 'normal' | 'fast' | 'custom') => {
    setSpeedPresetState(preset);
    setSpeedPreset(preset);
  };
  
  // Update a specific color in the gradient
  const handleGradientColorEdit = (index: number, color: [number, number, number]) => {
    const newGradientColors = [...gradientColors];
    newGradientColors[index] = color;
    setGradientColors(newGradientColors);
  };

  return (
    <EditorLayout
      title="Text Message"
      isNewItem={isNewItem}
      onBack={handleBack}
      onSave={handleSave}
      isLoading={loading}
      isSaving={saving}
      status={status}
      onStatusClose={() => setStatus(null)}
    >
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
          <span className="p-1 bg-indigo-100 dark:bg-indigo-900/20 rounded mr-2 text-indigo-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
          </span>
          Message Text
        </h3>
        <TextEditor 
          initialValue={formData.content?.data?.text || ''}
          onChange={(text) => setFormData(prev => ({
            ...prev,
            content: {
              ...prev.content!,
              data: {
                ...prev.content!.data,
                text: text
              }
            }
          }))}
          onSegmentsChange={handleTextSegmentsChange}
          selectedColor={selectedColor}
          onColorChange={handleColorChange}
          textSegments={textSegments}
        />
      </div>
      
      {/* Improved scroll checkbox with better functionality */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 my-6">
        <div className="flex items-center mb-5">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="scroll"
              name="scroll"
              checked={formData.content?.data?.scroll || false}
              onChange={(e) => {
                // Explicitly handle the toggle to ensure state updates properly
                const isChecked = e.target.checked;
                setFormData(prev => ({
                  ...prev,
                  content: {
                    ...prev.content!,
                    data: {
                      ...prev.content!.data,
                      scroll: isChecked
                    }
                  }
                }));
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            <span className="ml-3 font-medium text-gray-800 dark:text-gray-200">Scroll Text</span>
          </label>
          <div className="ml-2 text-sm text-gray-500 dark:text-gray-400">
            (Scrolling text moves across the display)
          </div>
        </div>

        {/* Scroll controls with animation */}
        <div 
          className={`transition-all duration-300 ease-in-out overflow-hidden ${formData.content?.data?.scroll ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 invisible'}`}
        >
          {/* Scroll Speed */}
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">Scroll Speed:</label>
            <div className="grid grid-cols-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
              <button 
                onClick={() => handleSpeedPresetChange('slow')}
                className={`py-3 text-center transition-colors ${speedPreset === 'slow' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
              >
                Slow
              </button>
              <button 
                onClick={() => handleSpeedPresetChange('normal')}
                className={`py-3 text-center transition-colors ${speedPreset === 'normal' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
              >
                Normal
              </button>
              <button 
                onClick={() => handleSpeedPresetChange('fast')}
                className={`py-3 text-center transition-colors ${speedPreset === 'fast' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
              >
                Fast
              </button>
              <button 
                onClick={() => handleSpeedPresetChange('custom')}
                className={`py-3 text-center transition-colors ${speedPreset === 'custom' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
              >
                Custom
              </button>
            </div>
            
            {/* Only show slider for custom with enhanced animation - fixed layout */}
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${speedPreset === 'custom' ? 'max-h-24 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
              <div className="flex items-center gap-4 h-10">
                <div className="relative flex-grow flex items-center">
                  <input
                    type="range"
                    name="speed"
                    min="10"
                    max="250"
                    value={formData.content?.data?.speed || 50}
                    onChange={(e) => {
                      // Get the value
                      const value = parseInt(e.target.value);
                      
                      // Update the CSS variable for the track fill directly on the element
                      const percentage = ((value - 10) / (250 - 10)) * 100;
                      e.target.style.setProperty('--slider-value', `${percentage}%`);
                      
                      // Update the state
                      setFormData(prev => ({
                        ...prev,
                        content: {
                          ...prev.content!,
                          data: {
                            ...prev.content!.data,
                            speed: value
                          }
                        }
                      }));
                      setSpeedPresetState('custom');
                    }}
                    style={{ '--slider-value': `${((formData.content?.data?.speed || 50) - 10) / (250 - 10) * 100}%` } as React.CSSProperties}
                    className="enhanced-slider appearance-none cursor-pointer w-full"
                  />
                </div>
                <div className="brightness-value whitespace-nowrap">
                  {formData.content?.data?.speed || 50} px/sec
                </div>
              </div>
            </div>
          </div>

          {/* Number of Repeats with direct input */}
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">Number of Repeats:</label>
            <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-2">
              <button 
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  repeat_count: Math.max(1, (prev.repeat_count || 1) - 1) 
                }))}
                className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg mr-2 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
              
              <input
                type="number"
                name="repeat_count"
                value={formData.repeat_count || 1}
                onChange={(e) => {
                  // Ensure we have a valid positive integer
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value >= 1) {
                    setFormData(prev => ({ ...prev, repeat_count: value }));
                  } else if (e.target.value === '') {
                    // Allow empty input while typing, but set to 1 on blur
                    setFormData(prev => ({ ...prev, repeat_count: 1 }));
                  }
                }}
                onBlur={() => {
                  // Ensure we don't allow empty or invalid values after blur
                  if (!formData.repeat_count || formData.repeat_count < 1) {
                    setFormData(prev => ({ ...prev, repeat_count: 1 }));
                  }
                }}
                min="1"
                className="w-16 h-10 text-center bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-600 rounded font-medium text-gray-800 dark:text-gray-200 text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              
              <button 
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  repeat_count: (prev.repeat_count || 1) + 1 
                }))}
                className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg ml-2 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </button>
              
              <span className="ml-4 text-gray-700 dark:text-gray-300">times</span>
            </div>
          </div>
        </div>

        {/* Static duration control with direct input */}
        <div 
          className={`transition-all duration-300 ease-in-out overflow-hidden ${!formData.content?.data?.scroll ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 invisible'}`}
        >
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">Duration (seconds):</label>
            <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-2">
              <button 
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  duration: Math.max(1, (prev.duration || 10) - 1) 
                }))}
                className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg mr-2 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
              
              <input
                type="number"
                name="duration"
                value={formData.duration || 10}
                onChange={(e) => {
                  // Ensure we have a valid positive number
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value >= 1) {
                    setFormData(prev => ({ ...prev, duration: value }));
                  } else if (e.target.value === '') {
                    // Allow empty input while typing, but set to 10 on blur
                    setFormData(prev => ({ ...prev, duration: 10 }));
                  }
                }}
                onBlur={() => {
                  // Ensure we don't allow empty or invalid values after blur
                  if (!formData.duration || formData.duration < 1) {
                    setFormData(prev => ({ ...prev, duration: 10 }));
                  }
                }}
                min="1"
                className="w-16 h-10 text-center bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-600 rounded font-medium text-gray-800 dark:text-gray-200 text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              
              <button 
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  duration: (prev.duration || 10) + 1 
                }))}
                className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg ml-2 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </button>
              
              <span className="ml-4 text-gray-700 dark:text-gray-300">seconds</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Border Effects */}
      <div className="mb-8 border-t border-gray-200 dark:border-gray-700 pt-8">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Border Effect</h3>
        <BorderEffectSelector
          selectedEffect={selectedBorderEffect}
          onEffectChange={handleBorderEffectChange}
          gradientColors={gradientColors}
          onGradientColorChange={handleGradientColorEdit}
          onAddGradientColor={handleAddGradientColor}
          onRemoveGradientColor={handleRemoveGradientColor}
        />
      </div>
    </EditorLayout>
  );
} 