import React from 'react';

interface EffectOptionsProps {
  selectedEffect: string;
  onEffectChange: (effect: string) => void;
}

export default function EffectOptions({ selectedEffect, onEffectChange }: EffectOptionsProps) {
  // Effect options
  const effects = [
    { id: 'none', label: 'None', icon: '❌' },
    { id: 'rainbow', label: 'Rainbow', icon: '🌈' },
    { id: 'pulse', label: 'Pulse', icon: '💓' },
    { id: 'sparkle', label: 'Sparkle', icon: '✨' },
    { id: 'gradient', label: 'Gradient | Color', icon: '🎨' }
  ];
  
  return (
    <div className="effect-options grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-5">
      {effects.map(effect => (
        <button
          key={effect.id}
          className={`effect-option flex flex-col items-center p-4 ${
            selectedEffect === effect.id 
              ? 'border-2 border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
              : 'border border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 bg-white dark:bg-gray-800'
          } rounded-xl transition-all shadow-sm hover:shadow`}
          onClick={() => onEffectChange(effect.id)}
        >
          <div className="effect-option-icon text-2xl mb-2">
            {effect.icon}
          </div>
          <span className="text-sm font-medium">{effect.label}</span>
        </button>
      ))}
    </div>
  );
} 