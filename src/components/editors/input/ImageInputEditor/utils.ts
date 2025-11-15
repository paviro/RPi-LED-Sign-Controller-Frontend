import { Transform } from './types';

export const SCALE_DECIMAL_PLACES = 3;
const SCALE_FACTOR = 10 ** SCALE_DECIMAL_PLACES;

export const clampScale = (value: number): number => {
  const rounded = Number.isFinite(value) ? Math.round(value * SCALE_FACTOR) / SCALE_FACTOR : 1;
  return Math.min(1, Math.max(0.01, rounded));
};

export const sanitizeTransform = (transform: Transform): Transform => ({
  x: Math.round(transform.x),
  y: Math.round(transform.y),
  scale: clampScale(transform.scale)
});

