import { BorderEffect, RGBColor } from '../../../../../types';

/**
 * Returns a border effect object of the specified type
 * @param effectType - Type of border effect to create
 * @param colors - Optional colors for effects that use them
 * @returns A properly formatted BorderEffect object
 */
export function createBorderEffect(
  effectType: string, 
  colors?: RGBColor[]
): BorderEffect {
  const effect = effectType.toLowerCase();
  
  // Effects that use colors
  if (['pulse', 'sparkle', 'gradient'].includes(effect) && colors?.length) {
    return { 
      [effect.charAt(0).toUpperCase() + effect.slice(1)]: { 
        colors: colors 
      } 
    } as BorderEffect;
  }
  
  // Special case for Rainbow
  if (effect === 'rainbow') {
    return { Rainbow: null };
  }
  
  // Default to None
  return { None: null };
}

/**
 * Extracts the type of border effect from a BorderEffect object
 * @param effect - The border effect object
 * @returns The effect type as a string (lowercase)
 */
export function getBorderEffectType(effect: BorderEffect): string {
  return Object.keys(effect)[0]?.toLowerCase() || 'none';
}

/**
 * Extracts colors from a border effect if it has them
 * @param effect - The border effect object
 * @returns Array of colors or empty array if none
 */
export function getBorderEffectColors(effect: BorderEffect): RGBColor[] {
  const effectValue = Object.values(effect)[0];
  
  if (
    effectValue && 
    typeof effectValue === 'object' && 
    'colors' in effectValue &&
    Array.isArray(effectValue.colors)
  ) {
    return effectValue.colors as RGBColor[];
  }
  
  return [];
} 