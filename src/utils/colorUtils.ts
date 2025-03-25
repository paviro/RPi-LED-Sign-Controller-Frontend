/**
 * Color utility functions for working with RGB values
 */

type RGBColor = [number, number, number];

/**
 * Converts RGB color values to hexadecimal format
 * @param rgb - RGB color as [r, g, b] tuple or individual r, g, b components
 * @returns Hex color string (e.g. #FF5500)
 */
export function rgbToHex(rgb: RGBColor): string;
export function rgbToHex(r: number, g: number, b: number): string;
export function rgbToHex(
  rOrRgb: number | RGBColor, 
  g?: number, 
  b?: number
): string {
  let r: number, gb: number, bb: number;
  
  if (Array.isArray(rOrRgb)) {
    [r, gb, bb] = rOrRgb;
  } else {
    r = rOrRgb;
    gb = g!;
    bb = b!;
  }
  
  return `#${r.toString(16).padStart(2, '0')}${gb.toString(16).padStart(2, '0')}${bb.toString(16).padStart(2, '0')}`;
}

/**
 * Converts hex color string to RGB tuple
 * @param hex - Hex color string (with or without # prefix)
 * @returns RGB values as [r, g, b] tuple
 */
export function hexToRgb(hex: string): RGBColor {
  // Remove # if present
  const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;
  
  // Parse RGB components
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  
  return [r, g, b];
}

/**
 * Generates a linear gradient preview based on colors
 * @param gradientColors - Array of RGB color tuples
 * @returns CSS gradient string or solid color
 */
export const getGradientPreview = (gradientColors: Array<RGBColor>): string => {
  if (gradientColors.length === 0) return 'transparent';
  if (gradientColors.length === 1) {
    return rgbToHex(gradientColors[0]);
  }
  
  const stops = gradientColors.map((color, index) => {
    const percentage = (index / (gradientColors.length - 1)) * 100;
    return `${rgbToHex(color)} ${percentage}%`;
  });
  
  return `linear-gradient(to right, ${stops.join(', ')})`;
}; 

/**
 * Generates a random vibrant color
 * Ensures at least one RGB channel has high intensity for better visibility
 * @returns RGB color as [r, g, b] tuple
 */
export const getRandomColor = (): RGBColor => {
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

/**
 * Interpolates between two colors
 * @param color1 - First RGB color
 * @param color2 - Second RGB color
 * @param ratio - Interpolation ratio (0-1)
 * @returns Interpolated RGB color
 */
export const interpolateColors = (
  color1: RGBColor, 
  color2: RGBColor, 
  ratio: number
): RGBColor => {
  return [
    Math.round(color1[0] + (color2[0] - color1[0]) * ratio),
    Math.round(color1[1] + (color2[1] - color1[1]) * ratio),
    Math.round(color1[2] + (color2[2] - color1[2]) * ratio)
  ];
};