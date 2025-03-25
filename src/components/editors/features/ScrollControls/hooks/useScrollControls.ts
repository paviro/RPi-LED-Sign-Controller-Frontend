import { useState, useCallback } from 'react';

interface ScrollControlsState {
  scroll: boolean;
  speed: number;
  duration: number;
  repeatCount: number;
}

export function useScrollControls(initialState: Partial<ScrollControlsState> = {}) {
  const [scroll, setScroll] = useState(initialState.scroll || false);
  const [speed, setSpeed] = useState(initialState.speed || 50);
  const [duration, setDuration] = useState(initialState.duration || 10);
  const [repeatCount, setRepeatCount] = useState(initialState.repeatCount || 1);

  const updateScroll = useCallback((scroll: boolean) => {
    setScroll(scroll);
  }, []);
  
  const updateScrollSpeed = useCallback((speed: number) => {
    setSpeed(speed);
  }, []);
  
  const updateDuration = useCallback((duration: number) => {
    setDuration(duration);
  }, []);
  
  const updateRepeatCount = useCallback((repeatCount: number) => {
    setRepeatCount(repeatCount);
  }, []);

  return {
    scroll,
    speed,
    duration,
    repeatCount,
    updateScroll,
    updateScrollSpeed,
    updateDuration,
    updateRepeatCount
  };
} 