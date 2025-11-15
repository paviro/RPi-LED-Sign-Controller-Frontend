import React from 'react';
import ColorPicker from '../../../common/ColorPicker';

interface ColorEditorProps {
  gradientColors: Array<[number, number, number]>;
  activeColorIndex: number;
  onColorChange: (index: number, color: [number, number, number]) => void;
}

export default function ColorEditor({
  gradientColors,
  activeColorIndex,
  onColorChange
}: ColorEditorProps) {
  const safeIndex = Math.min(
    activeColorIndex,
    Math.max(gradientColors.length - 1, 0)
  );
  const selectedColor =
    gradientColors[safeIndex] ??
    gradientColors[Math.max(0, gradientColors.length - 1)];

  if (!selectedColor) {
    return null;
  }

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Selected Color:</h5>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Color {safeIndex + 1} of {gradientColors.length}
        </div>
      </div>
      <ColorPicker
        color={selectedColor}
        onChange={(color) => onColorChange(safeIndex, color)}
      />
    </div>
  );
}