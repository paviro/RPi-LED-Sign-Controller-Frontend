'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import NumberInputControl from '../../common/NumberInputControl';
import ColorPicker from '../../common/ColorPicker';
import BorderEffectSelector from '../../features/BorderEffectSelector/BorderEffectSelector';
import { useBorderEffects } from '../../features/BorderEffectSelector/hooks/useBorderEffects';
import { getRandomColor, rgbToHex } from '../../../../utils/colorUtils';
import {
  AnimationPreset,
  BorderEffect,
  RGBColor
} from '../../../../types';
import { createDefaultAnimationContent, useAnimationEditorForm } from './hooks/useAnimationEditorForm';
import useAnimationPreview from './hooks/useAnimationPreview';
import ColorSwatches from '../../features/BorderEffectSelector/components/ColorSwatches';
import ColorEditor from '../../features/BorderEffectSelector/components/ColorEditor';

interface AnimationInputEditorProps {
  itemId: string | null;
  updateStatus: (status: { message: string; type: 'error' | 'success' | 'info' } | null) => void;
  updateSaving: (saving: boolean) => void;
  updateLoading: (loading: boolean) => void;
  onBack?: () => void;
  registerExitPreview?: (exitFn: () => void) => void;
}

const presetOptions: Array<{
  id: AnimationPreset;
  label: string;
  description: string;
}> = [
  {
    id: 'Pulse',
    label: 'Full-Screen Pulse',
    description: 'Breathing brightness fade through the palette.'
  },
  {
    id: 'PaletteWave',
    label: 'Palette Wave',
    description: 'Animated gradient bands sweeping across the canvas.'
  },
  {
    id: 'DualPulse',
    label: 'Dual-Phase Pulse',
    description: 'Two offset pulses overlapping for a lively beat.'
  },
  {
    id: 'ColorFade',
    label: 'Color Fade',
    description: 'Slowly drifting color wash using the palette order.'
  },
  {
    id: 'Strobe',
    label: 'Strobe',
    description: 'Bold flash with a configurable fade out.'
  },
  {
    id: 'Sparkle',
    label: 'Sparkle Fill',
    description: 'Sparkling pixels across the entire panel.'
  },
  {
    id: 'Plasma',
    label: 'Plasma Flow',
    description: 'Organic plasma waves generated from layered noise.'
  },
  {
    id: 'MosaicTwinkle',
    label: 'Mosaic Twinkle',
    description: 'Colorful square tiles gently twinkling across the screen.'
  }
];

interface FloatInputProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}

function FloatInputControl({
  label,
  value,
  min = 0,
  max = 1,
  step = 0.05,
  suffix,
  onChange
}: FloatInputProps) {
  return (
    <div className="mb-6">
      <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="flex-1"
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-24 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-right"
        />
        {suffix && <span className="text-gray-500 dark:text-gray-400">{suffix}</span>}
      </div>
    </div>
  );
}

export default function AnimationInputEditor({
  itemId,
  updateStatus,
  updateSaving,
  updateLoading,
  onBack,
  registerExitPreview
}: AnimationInputEditorProps) {
  const handleSuccess = useCallback(() => {
    if (onBack) {
      onBack();
    }
  }, [onBack]);

  const {
    form,
    animationContent,
    setAnimationContent,
    updateDuration,
    loading,
    saving,
    status,
    setStatus,
    saveItem
  } = useAnimationEditorForm({
    itemId,
    onSuccess: handleSuccess
  });

  const {
    borderEffectType,
    setBorderEffectType,
    gradientColors,
    handleAddGradientColor,
    handleRemoveGradientColor,
    handleGradientColorEdit,
    getBorderEffectObject
  } = useBorderEffects((form.border_effect as BorderEffect) || undefined);

  const activeBorderEffect = useMemo(() => getBorderEffectObject(), [getBorderEffectObject]);

  const preview = useAnimationPreview({
    formData: form,
    animationContent,
    borderEffect: activeBorderEffect,
    loading
  });
  const { stopPreview, refreshPreview, sessionExpired } = preview;

  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);
  const [visible, setVisible] = useState(false);
  const [showBorderColorPicker, setShowBorderColorPicker] = useState(false);
  const borderColorButtonRef = useRef<HTMLDivElement | null>(null);
  const borderColorPopoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    if (loading) {
      setVisible(false);
      timeoutId = setTimeout(() => setShowLoadingIndicator(true), 400);
    } else {
      setShowLoadingIndicator(false);
      setTimeout(() => setVisible(true), 50);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading]);

  useEffect(() => {
    updateLoading(loading);
  }, [loading, updateLoading]);

  useEffect(() => {
    updateSaving(saving);
  }, [saving, updateSaving]);

  useEffect(() => {
    if (status) {
      updateStatus(status);
    }
  }, [status, updateStatus]);

  useEffect(() => {
    const handleSave = async () => {
      await saveItem(activeBorderEffect);
      stopPreview();
    };

    document.addEventListener('editor-save', handleSave);
    return () => {
      document.removeEventListener('editor-save', handleSave);
    };
  }, [saveItem, activeBorderEffect, stopPreview]);

  useEffect(() => {
    if (registerExitPreview) {
      registerExitPreview(stopPreview);
    }
  }, [registerExitPreview, stopPreview]);

  useEffect(() => {
    if (sessionExpired && onBack) {
      const timer = setTimeout(() => onBack(), 500);
      return () => clearTimeout(timer);
    }
  }, [sessionExpired, onBack]);

  useEffect(() => {
    if (!showBorderColorPicker) {
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        borderColorPopoverRef.current &&
        !borderColorPopoverRef.current.contains(target) &&
        !borderColorButtonRef.current?.contains(target)
      ) {
        setShowBorderColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showBorderColorPicker]);

  useEffect(() => {
    if (animationContent.preset !== 'MosaicTwinkle' && showBorderColorPicker) {
      setShowBorderColorPicker(false);
    }
  }, [animationContent.preset, showBorderColorPicker]);

  const handlePresetChange = useCallback(
    (preset: AnimationPreset) => {
      setAnimationContent((current) => {
        if (current.preset === preset) {
          return current;
        }
        return createDefaultAnimationContent(preset, current.colors);
      });
    },
    [setAnimationContent]
  );

  const updatePaletteColor = useCallback(
    (index: number, color: RGBColor) => {
      setAnimationContent((current) => {
        const colors = current.colors.slice();
        colors[index] = color;
        return { ...current, colors };
      });
    },
    [setAnimationContent]
  );

  const addPaletteColor = useCallback(() => {
    setAnimationContent((current) => ({
      ...current,
      colors: [...current.colors, getRandomColor()]
    }));
  }, [setAnimationContent]);

  const removePaletteColor = useCallback(
    (index: number) => {
      setAnimationContent((current) => {
        if (current.colors.length <= 1) {
          setStatus({
            message: 'Animations require at least one color.',
            type: 'info'
          });
          return current;
        }
        const colors = current.colors.filter((_, idx) => idx !== index);
        return { ...current, colors };
      });
    },
    [setAnimationContent, setStatus]
  );

  const [activePaletteIndex, setActivePaletteIndex] = useState(0);
  const paletteLengthRef = useRef(animationContent.colors.length);

  useEffect(() => {
    const prevLen = paletteLengthRef.current;
    const nextLen = animationContent.colors.length;
    if (nextLen === 0) {
      setActivePaletteIndex(0);
    } else if (nextLen > prevLen) {
      setActivePaletteIndex(nextLen - 1);
    } else {
      setActivePaletteIndex((prev) => Math.min(prev, Math.max(0, nextLen - 1)));
    }
    paletteLengthRef.current = nextLen;
  }, [animationContent.colors.length]);

  const safePaletteIndex = Math.min(
    activePaletteIndex,
    Math.max(animationContent.colors.length - 1, 0)
  );

  const resetAnimationParameters = useCallback(() => {
    setAnimationContent((current) =>
      createDefaultAnimationContent(current.preset, current.colors)
    );
  }, [setAnimationContent]);

  const renderPresetControls = () => {
    switch (animationContent.preset) {
      case 'Pulse':
        return (
          <NumberInputControl
            label="Cycle Duration"
            value={animationContent.cycle_ms}
            onChange={(value) =>
              setAnimationContent((current) =>
                current.preset !== 'Pulse' ? current : { ...current, cycle_ms: value }
              )
            }
            suffix="ms"
            minValue={400}
            maxValue={8000}
            step={100}
          />
        );
      case 'PaletteWave':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            <NumberInputControl
              label="Cycle Duration"
              value={animationContent.cycle_ms}
              onChange={(value) =>
                setAnimationContent((current) =>
                  current.preset !== 'PaletteWave' ? current : { ...current, cycle_ms: value }
                )
              }
              suffix="ms"
              minValue={600}
              maxValue={10000}
              step={100}
            />
            <NumberInputControl
              label="Wave Count"
              value={animationContent.wave_count}
              onChange={(value) =>
                setAnimationContent((current) =>
                  current.preset !== 'PaletteWave' ? current : { ...current, wave_count: value }
                )
              }
              minValue={1}
              maxValue={12}
            />
          </div>
        );
      case 'DualPulse':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            <NumberInputControl
              label="Cycle Duration"
              value={animationContent.cycle_ms}
              onChange={(value) =>
                setAnimationContent((current) =>
                  current.preset !== 'DualPulse' ? current : { ...current, cycle_ms: value }
                )
              }
              suffix="ms"
              minValue={600}
              maxValue={8000}
              step={100}
            />
            <FloatInputControl
              label="Phase Offset"
              value={animationContent.phase_offset}
              min={0}
              max={1}
              step={0.05}
              suffix="× cycle"
              onChange={(value) => {
                const clamped = Math.min(1, Math.max(0, value));
                setAnimationContent((current) =>
                  current.preset !== 'DualPulse' ? current : { ...current, phase_offset: clamped }
                );
              }}
            />
          </div>
        );
      case 'ColorFade':
        return (
          <FloatInputControl
            label="Drift Speed"
            value={animationContent.drift_speed}
            min={0.05}
            max={2}
            step={0.05}
            suffix="×"
            onChange={(value) => {
              const safeValue = Number.isFinite(value) ? Math.max(0.05, value) : 0.25;
              setAnimationContent((current) =>
                current.preset !== 'ColorFade' ? current : { ...current, drift_speed: safeValue }
              );
            }}
          />
        );
      case 'Strobe':
        const randomizeEnabled = Boolean(animationContent.randomize);
        const randomizationFactor =
          typeof animationContent.randomization_factor === 'number'
            ? animationContent.randomization_factor
            : 0.35;
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
              <NumberInputControl
                label="Flash Hold"
                value={animationContent.flash_ms}
                onChange={(value) =>
                  setAnimationContent((current) =>
                    current.preset !== 'Strobe' ? current : { ...current, flash_ms: value }
                  )
                }
                suffix="ms"
                minValue={40}
                maxValue={2000}
                step={20}
              />
              <NumberInputControl
                label="Fade Duration"
                value={animationContent.fade_ms}
                onChange={(value) =>
                  setAnimationContent((current) =>
                    current.preset !== 'Strobe' ? current : { ...current, fade_ms: value }
                  )
                }
                suffix="ms"
                minValue={60}
                maxValue={4000}
                step={20}
              />
            </div>
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    Randomize Strobe
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Randomize the timing between flashes for a more organic feel.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setAnimationContent((current) => {
                      if (current.preset !== 'Strobe') {
                        return current;
                      }
                      const nextRandomize = !current.randomize;
                      return {
                        ...current,
                        randomize: nextRandomize,
                        randomization_factor:
                          typeof current.randomization_factor === 'number'
                            ? current.randomization_factor
                            : 0.35
                      };
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    randomizeEnabled
                      ? 'bg-indigo-600 focus:ring-indigo-500'
                      : 'bg-gray-300 dark:bg-gray-700 focus:ring-gray-400'
                  }`}
                  aria-pressed={randomizeEnabled}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                      randomizeEnabled ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  ></span>
                </button>
              </div>
              {randomizeEnabled && (
                <FloatInputControl
                  label="Randomization Factor"
                  value={randomizationFactor}
                  min={0.05}
                  max={1}
                  step={0.05}
                  suffix="×"
                  onChange={(value) => {
                    const safeValue = Number.isFinite(value)
                      ? Math.min(1, Math.max(0.05, value))
                      : 0.35;
                    setAnimationContent((current) =>
                      current.preset !== 'Strobe'
                        ? current
                        : { ...current, randomization_factor: safeValue }
                    );
                  }}
                />
              )}
            </div>
          </>
        );
      case 'Sparkle': {
        const densityPercent = Number((animationContent.density * 100).toFixed(2));
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            <FloatInputControl
              label="Sparkle Density (% of pixels)"
              value={densityPercent}
              min={5}
              max={60}
              step={1}
              suffix="%"
              onChange={(value) => {
                const clampedPercent = Math.min(60, Math.max(5, value));
                const normalized = clampedPercent / 100;
                setAnimationContent((current) =>
                  current.preset !== 'Sparkle' ? current : { ...current, density: normalized }
                );
              }}
            />
            <NumberInputControl
              label="Twinkle Interval"
              value={animationContent.twinkle_ms}
              onChange={(value) =>
                setAnimationContent((current) =>
                  current.preset !== 'Sparkle' ? current : { ...current, twinkle_ms: value }
                )
              }
              suffix="ms"
              minValue={150}
              maxValue={2000}
              step={50}
            />
          </div>
        );
      }
      case 'Plasma': {
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            <FloatInputControl
              label="Flow Speed"
              value={animationContent.flow_speed}
              min={0.05}
              max={3}
              step={0.05}
              suffix="×"
              onChange={(value) => {
                const safeValue = Number.isFinite(value) ? Math.min(3, Math.max(0.05, value)) : 0.6;
                setAnimationContent((current) =>
                  current.preset !== 'Plasma' ? current : { ...current, flow_speed: safeValue }
                );
              }}
            />
            <FloatInputControl
              label="Detail Scale"
              value={animationContent.noise_scale}
              min={0.2}
              max={5}
              step={0.05}
              suffix="×"
              onChange={(value) => {
                const safeValue = Number.isFinite(value) ? Math.min(5, Math.max(0.2, value)) : 1.4;
                setAnimationContent((current) =>
                  current.preset !== 'Plasma' ? current : { ...current, noise_scale: safeValue }
                );
              }}
            />
          </div>
        );
      }
      case 'MosaicTwinkle': {
        const currentBorderColor = animationContent.border_color ?? [50, 0, 0];
        const borderColorHex = rgbToHex(
          currentBorderColor[0],
          currentBorderColor[1],
          currentBorderColor[2]
        );
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            <NumberInputControl
              label="Tile Size"
              value={animationContent.tile_size}
              onChange={(value) =>
                setAnimationContent((current) => {
                  if (current.preset !== 'MosaicTwinkle') {
                    return current;
                  }
                  const safeValue = Math.max(1, Math.min(12, Math.round(value)));
                  const maxBorder = Math.max(0, safeValue - 1);
                  const nextBorderSize = Math.min(current.border_size ?? 0, maxBorder);
                  return {
                    ...current,
                    tile_size: safeValue,
                    border_size: nextBorderSize
                  };
                })
              }
              minValue={1}
              maxValue={12}
            />
            <FloatInputControl
              label="Flow Speed"
              value={animationContent.flow_speed}
              min={0.05}
              max={3}
              step={0.05}
              suffix="×"
              onChange={(value) => {
                const safe = Number.isFinite(value) ? Math.max(0.05, value) : 0.35;
                setAnimationContent((current) =>
                  current.preset !== 'MosaicTwinkle'
                    ? current
                    : { ...current, flow_speed: safe }
                );
              }}
            />
            <NumberInputControl
              label="Border Size"
              value={animationContent.border_size}
              onChange={(value) => {
                const maxBorder = Math.max(0, animationContent.tile_size - 1);
                const clamped = Math.max(0, Math.min(value, maxBorder));
                setAnimationContent((current) =>
                  current.preset !== 'MosaicTwinkle'
                    ? current
                    : { ...current, border_size: clamped }
                );
              }}
              minValue={0}
              maxValue={Math.max(0, animationContent.tile_size - 1)}
              step={1}
              suffix="px"
            />
            <div className="mb-6 relative">
              <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                Border Color:
              </label>
              <div className="relative" ref={borderColorButtonRef}>
                <button
                  type="button"
                  onClick={() => setShowBorderColorPicker((prev) => !prev)}
                  className="flex items-center gap-3 h-14 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 shadow-sm hover:border-indigo-400 focus:outline-none focus-visible:ring focus-visible:ring-indigo-500/40 w-full"
                >
                  <span
                    className="w-8 h-8 rounded-md border border-gray-300 dark:border-gray-600 shadow-inner"
                    style={{ backgroundColor: borderColorHex }}
                  ></span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {showBorderColorPicker ? 'Close Picker' : 'Adjust Color'}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-gray-500 ml-auto"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {showBorderColorPicker && (
                  <div
                    ref={borderColorPopoverRef}
                    className="fixed z-50 bg-white dark:bg-gray-900 rounded-xl border-2 border-indigo-200 dark:border-indigo-600 shadow-xl p-4 overflow-hidden"
                    style={{
                      minWidth: '320px',
                      maxWidth: 'calc(100vw - 16px)',
                      top: borderColorButtonRef.current
                        ? `${borderColorButtonRef.current.getBoundingClientRect().bottom + 10}px`
                        : 0,
                      left: borderColorButtonRef.current
                        ? `${Math.max(
                            8,
                            Math.min(
                              borderColorButtonRef.current.getBoundingClientRect().left,
                              window.innerWidth - 320 - 16
                            )
                          )}px`
                        : 0
                    }}
                  >
                    <div className="bg-indigo-100 dark:bg-indigo-950 p-2 -mt-2 -mx-2 mb-3 rounded-t-lg border-b border-indigo-200 dark:border-indigo-700">
                      <h3 className="text-sm font-medium text-indigo-800 dark:text-indigo-200 flex items-center">
                        <span className="p-1 bg-indigo-200 dark:bg-indigo-900 rounded mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600 dark:text-indigo-300" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-14a2 2 0 10-4 0v1a2 2 0 104 0V2zm3 0a2 2 0 10-4 0v1a2 2 0 104 0V2zm3 0a2 2 0 10-4 0v1a2 2 0 104 0V2z" clipRule="evenodd" />
                          </svg>
                        </span>
                        Mosaic Border Color
                      </h3>
                    </div>
                    <ColorPicker
                      color={currentBorderColor}
                      onChange={(color) =>
                        setAnimationContent((current) =>
                          current.preset !== 'MosaicTwinkle'
                            ? current
                            : { ...current, border_color: color }
                        )
                      }
                    />
                    <div className="flex justify-end mt-3 pt-2 border-t border-gray-200 dark:border-gray-800">
                      <button
                        type="button"
                        className="px-3 py-1.5 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-medium"
                        onClick={() => setShowBorderColorPicker(false)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  if ((loading || !visible) && showLoadingIndicator) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-2"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading animation settings...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="h-40"></div>;
  }

  return (
    <div
      className={`space-y-6 transition-opacity duration-300 ease-in-out ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <section>
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
          <span className="p-1 bg-indigo-100 dark:bg-indigo-900/20 rounded mr-2 text-indigo-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 4a2 2 0 012-2h2a2 2 0 012 2v1.382a1 1 0 01-.553.894L8 7l1.447.724A1 1 0 0110 8.618V10a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm8 0a2 2 0 012-2h2a2 2 0 012 2v2.618a1 1 0 01-.553.894L16 8l1.447.724a1 1 0 01.553.894V14a2 2 0 01-2 2h-2a2 2 0 01-2-2V4z" />
            </svg>
          </span>
          Animation Preset
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          {presetOptions.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetChange(preset.id)}
              className={`text-left p-4 rounded-xl border transition-all ${
                animationContent.preset === preset.id
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm'
                  : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
              }`}
            >
              <div className="font-semibold text-gray-900 dark:text-gray-100">{preset.label}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{preset.description}</p>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 flex items-center">
            <span className="p-1 bg-indigo-100 dark:bg-indigo-900/20 rounded mr-2 text-indigo-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-14a2 2 0 10-4 0v1a2 2 0 104 0V2zm3 0a2 2 0 10-4 0v1a2 2 0 104 0V2zm3 0a2 2 0 10-4 0v1a2 2 0 104 0V2z" />
              </svg>
            </span>
            Animation Colors
          </h3>
          <button
            onClick={() => addPaletteColor()}
            className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Color
          </button>
        </div>

        <div className="p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-5">
          <ColorSwatches
            gradientColors={animationContent.colors}
            activeColorIndex={safePaletteIndex}
            editMode={false}
            setActiveColorIndex={setActivePaletteIndex}
            onRemoveColor={removePaletteColor}
          />
          {animationContent.colors.length > 0 && (
            <ColorEditor
              gradientColors={animationContent.colors}
              activeColorIndex={safePaletteIndex}
              onColorChange={updatePaletteColor}
            />
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 flex items-center">
            <span className="p-1 bg-indigo-100 dark:bg-indigo-900/20 rounded mr-2 text-indigo-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </span>
            Animation Parameters
          </h3>
          <button
            onClick={resetAnimationParameters}
            className="px-3 py-1.5 text-sm rounded-lg border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            Reset to defaults
          </button>
        </div>
        {renderPresetControls()}
      </section>

      <NumberInputControl
        label="Duration (Playlist Item)"
        value={form.duration || 10}
        onChange={(value) => updateDuration(value)}
        suffix="seconds"
        minValue={2}
        maxValue={120}
      />

      <BorderEffectSelector
        selectedEffect={borderEffectType}
        onEffectChange={(effect: string) => {
          setBorderEffectType(effect);
          refreshPreview();
        }}
        gradientColors={gradientColors}
        onGradientColorChange={handleGradientColorEdit}
        onAddGradientColor={handleAddGradientColor}
        onRemoveGradientColor={handleRemoveGradientColor}
      />
    </div>
  );
}

