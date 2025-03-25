import { useState, useCallback, useEffect } from 'react';
import { getRandomColor } from '../../../../../utils/colorUtils';
import { 
  createBorderEffect, 
  getBorderEffectType, 
  getBorderEffectColors 
} from '../utils/borderEffectUtils';
import { BorderEffect, RGBColor } from '../../../../../types';

/**
 * Hook to manage border effect state and operations
 */
export function useBorderEffects(initialEffect?: BorderEffect) {
  // Border effect type
  const [borderEffectType, setBorderEffectType] = useState<string>(
    initialEffect ? getBorderEffectType(initialEffect) : 'none'
  );
  
  // Initialize gradient colors from initial effect or with a random color
  const [gradientColors, setGradientColors] = useState<RGBColor[]>(
    initialEffect 
      ? getBorderEffectColors(initialEffect)
      : [getRandomColor()]
  );

  // Update effect type and colors when initialEffect changes 
  useEffect(() => {
    if (initialEffect) {
      setBorderEffectType(getBorderEffectType(initialEffect));
      const colors = getBorderEffectColors(initialEffect);
      if (colors.length > 0) {
        setGradientColors(colors);
      }
    }
  }, [initialEffect]);

  // Ensure we always have at least one color
  useEffect(() => {
    if (gradientColors.length === 0) {
      setGradientColors([getRandomColor()]);
    }
  }, [gradientColors]);

  // Add a new random color to the gradient
  const handleAddGradientColor = useCallback(() => {
    const newColor = getRandomColor();
    setGradientColors(prev => [...prev, newColor]);
  }, []);

  // Remove a color from the gradient
  const handleRemoveGradientColor = useCallback((index: number) => {
    // Maintain at least one color in the gradient
    if (gradientColors.length <= 1) return;
    
    setGradientColors(prev => prev.filter((_, i) => i !== index));
  }, [gradientColors.length]);
  
  // Update a specific color in the gradient
  const handleGradientColorEdit = useCallback((index: number, color: RGBColor) => {
    setGradientColors(prev => {
      const newColors = [...prev];
      newColors[index] = color;
      return newColors;
    });
  }, []);

  // Get the border effect object using the utility function
  const getBorderEffectObject = useCallback(() => {
    return createBorderEffect(borderEffectType, gradientColors);
  }, [borderEffectType, gradientColors]);

  return {
    borderEffectType,
    setBorderEffectType,
    gradientColors,
    setGradientColors,
    handleAddGradientColor,
    handleRemoveGradientColor,
    handleGradientColorEdit,
    getBorderEffectObject
  };
} 