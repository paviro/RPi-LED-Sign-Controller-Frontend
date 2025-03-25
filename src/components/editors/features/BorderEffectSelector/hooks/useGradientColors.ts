import { useState, useEffect } from 'react';

export function useGradientColors(
  gradientColors: Array<[number, number, number]>,
  onGradientColorChange: (index: number, color: [number, number, number]) => void,
  onAddGradientColor: () => void,
  onRemoveGradientColor: (index: number) => void
) {
  const [activeColorIndex, setActiveColorIndex] = useState(0);
  const [editMode, setEditMode] = useState(false);
  
  // Handle window resize to exit edit mode on larger screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && editMode) {
        setEditMode(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [editMode]);
  
  // Ensure active index is valid after color removal
  useEffect(() => {
    if (activeColorIndex >= gradientColors.length && gradientColors.length > 0) {
      requestAnimationFrame(() => {
        setActiveColorIndex(prev => {
          if (prev >= gradientColors.length) {
            return gradientColors.length - 1;
          }
          return prev;
        });
      });
    }
  }, [gradientColors.length, activeColorIndex]);
  
  const toggleEditMode = () => {
    setEditMode(!editMode);
  };
  
  const handleAddColor = () => {
    onAddGradientColor();
    setTimeout(() => {
      setActiveColorIndex(gradientColors.length);
    }, 0);
  };
  
  const handleGradientColorEdit = (index: number, color: [number, number, number]) => {
    if (
      gradientColors[index][0] !== color[0] ||
      gradientColors[index][1] !== color[1] ||
      gradientColors[index][2] !== color[2]
    ) {
      onGradientColorChange(index, color);
    }
  };
  
  const handleRemoveColor = (index: number) => {
    // Don't remove if it's the last color
    if (gradientColors.length <= 1) {
      return;
    }
    
    const newIndex = index > 0 ? index - 1 : 0;
    
    // Adjust active index if needed, before removing the color
    if (activeColorIndex === index) {
      setActiveColorIndex(newIndex);
    } else if (activeColorIndex > index) {
      setActiveColorIndex(activeColorIndex - 1);
    }
    
    // Remove the color
    onRemoveGradientColor(index);
  };
  
  return {
    activeColorIndex,
    setActiveColorIndex,
    editMode,
    toggleEditMode,
    handleAddColor,
    handleGradientColorEdit,
    handleRemoveColor
  };
} 