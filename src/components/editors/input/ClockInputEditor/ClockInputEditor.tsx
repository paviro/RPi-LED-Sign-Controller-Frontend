'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import NumberInputControl from '../../common/NumberInputControl';
import ColorPicker from '../../common/ColorPicker';
import BorderEffectSelector from '../../features/BorderEffectSelector/BorderEffectSelector';
import { ClockFormat, RGBColor } from '../../../../types';
import { useClockEditorForm } from './hooks/useClockEditorForm';
import useClockPreview from './hooks/useClockPreview';

interface ClockInputEditorProps {
  itemId: string | null;
  updateStatus: (status: { message: string; type: 'error' | 'success' | 'info' } | null) => void;
  updateSaving: (saving: boolean) => void;
  updateLoading: (loading: boolean) => void;
  onBack?: () => void;
  registerExitPreview?: (exitFn: () => void) => void;
}

export default function ClockInputEditor({
  itemId,
  updateStatus,
  updateSaving,
  updateLoading,
  onBack,
  registerExitPreview
}: ClockInputEditorProps) {
  const {
    loading,
    saving,
    status,
    duration,
    clockSettings,
    updateDuration,
    updateFormat,
    updateShowSeconds,
    updateColor,
    borderEffectType,
    gradientColors,
    handleBorderEffectChange,
    handleAddGradientColor,
    handleRemoveGradientColor,
    handleGradientColorEdit,
    getBorderEffectObject,
    saveItem
  } = useClockEditorForm({ itemId, onSuccess: onBack });

  const clockPreview = useClockPreview({
    clockSettings,
    duration,
    getBorderEffectObject,
    loading
  });
  const { stopPreview, sessionExpired } = clockPreview;

  useEffect(() => {
    updateSaving(saving);
  }, [saving, updateSaving]);

  useEffect(() => {
    updateLoading(loading);
  }, [loading, updateLoading]);

  useEffect(() => {
    updateStatus(status);
  }, [status, updateStatus]);

  const colorSwatchStyle = useMemo(
    () => ({
      backgroundColor: `rgb(${clockSettings.color[0]}, ${clockSettings.color[1]}, ${clockSettings.color[2]})`
    }),
    [clockSettings.color]
  );

  const handleSave = useCallback(async () => {
    await saveItem();
    stopPreview();
  }, [saveItem, stopPreview]);

  useEffect(() => {
    const listener = () => {
      void handleSave();
    };
    document.addEventListener('editor-save', listener);
    return () => {
      document.removeEventListener('editor-save', listener);
    };
  }, [handleSave]);

  useEffect(() => {
    if (registerExitPreview) {
      registerExitPreview(stopPreview);
    }
  }, [registerExitPreview, stopPreview]);

  useEffect(() => {
    if (sessionExpired && onBack) {
      const timer = setTimeout(() => {
        onBack();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [onBack, sessionExpired]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-2" />
          <p className="text-gray-600 dark:text-gray-400">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 flex items-center">
            <span className="p-1.5 bg-indigo-100 dark:bg-indigo-900/20 rounded mr-2 text-indigo-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5zm.75 5.25a.75.75 0 00-1.5 0v4.5c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5H12.75V7.5z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            Clock Preview
          </h3>
        </div>
        <ClockPreview
          format={clockSettings.format}
          showSeconds={clockSettings.show_seconds}
          color={clockSettings.color}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <NumberInputControl
          label="Duration"
          suffix="seconds"
          value={duration}
          onChange={updateDuration}
          minValue={1}
          defaultValue={10}
          className="mb-0"
        />

        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">Clock Format:</label>
          <div className="flex gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-2 h-14">
            <FormatButton
              label="24-hour"
              active={clockSettings.format === '24h'}
              onClick={() => updateFormat('24h')}
            />
            <FormatButton
              label="12-hour"
              active={clockSettings.format === '12h'}
              onClick={() => updateFormat('12h')}
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">Show Seconds:</label>
          <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-2 h-14">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={clockSettings.show_seconds}
                onChange={(e) => updateShowSeconds(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
              <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                {clockSettings.show_seconds ? 'Yes' : 'No'}
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/60">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">Clock Color</p>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-600" style={colorSwatchStyle} />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              rgb({clockSettings.color[0]}, {clockSettings.color[1]}, {clockSettings.color[2]})
            </span>
          </div>
          <ColorPicker color={clockSettings.color} onChange={updateColor} />
        </div>

        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 dark:text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                The clock uses the built-in system time of your Raspberry Pi. Make sure the device time zone is configured correctly for accurate display.
              </p>
            </div>
          </div>
        </div>
      </div>

      <BorderEffectSelector
        selectedEffect={borderEffectType}
        onEffectChange={handleBorderEffectChange}
        gradientColors={gradientColors}
        onGradientColorChange={handleGradientColorEdit}
        onAddGradientColor={handleAddGradientColor}
        onRemoveGradientColor={handleRemoveGradientColor}
      />
    </div>
  );
}

function ClockPreview({
  format,
  showSeconds,
  color
}: {
  format: ClockFormat;
  showSeconds: boolean;
  color: RGBColor;
}) {
  const [preview, setPreview] = useState(() => getTimeString(format, showSeconds));
  useEffect(() => {
    setPreview(getTimeString(format, showSeconds));
    const interval = window.setInterval(() => {
      setPreview(getTimeString(format, showSeconds));
    }, showSeconds ? 1000 : 5000);
    return () => window.clearInterval(interval);
  }, [format, showSeconds]);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-black flex items-center justify-center py-10 shadow-inner">
      <div
        className="font-mono text-4xl md:text-5xl tracking-widest"
        style={{ color: `rgb(${color[0]}, ${color[1]}, ${color[2]})` }}
      >
        {preview}
      </div>
    </div>
  );
}

const getTimeString = (format: ClockFormat, showSeconds: boolean) => {
  const now = new Date();
  let hours = now.getHours();
  let suffix = '';

  if (format === '12h') {
    suffix = hours >= 12 ? ' PM' : ' AM';
    hours = hours % 12 || 12;
  }

  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const hourString = format === '24h' ? hours.toString().padStart(2, '0') : hours.toString();

  return showSeconds ? `${hourString}:${minutes}:${seconds}${suffix}` : `${hourString}:${minutes}${suffix}`;
};

function FormatButton({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 px-4 text-sm font-medium transition-all rounded-md flex items-center justify-center ${
        active
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50'
      }`}
    >
      {label}
    </button>
  );
}
