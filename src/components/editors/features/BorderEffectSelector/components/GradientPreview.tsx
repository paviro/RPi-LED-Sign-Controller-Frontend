import React from 'react';
import { getGradientPreview } from '../../../../../utils/colorUtils';

interface GradientPreviewProps {
  gradientColors: Array<[number, number, number]>;
}

export default function GradientPreview({ gradientColors }: GradientPreviewProps) {
  return (
    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-100 dark:border-gray-700">
      <h5 className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Preview</h5>
      <div 
        className="h-8 rounded-lg shadow-inner overflow-hidden" 
        style={{ background: getGradientPreview(gradientColors) }}
      ></div>
    </div>
  );
} 