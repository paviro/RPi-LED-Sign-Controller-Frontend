interface AnimationToggleProps {
  enabled: boolean;
  disabled?: boolean;
  onEnable: () => void;
  onDisable: () => void;
}

export default function AnimationToggle({
  enabled,
  disabled,
  onEnable,
  onDisable
}: AnimationToggleProps) {
  return (
    <div className="flex items-center mb-5">
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          id="animation"
          name="animation"
          checked={enabled}
          onChange={(event) => (event.target.checked ? onEnable() : onDisable())}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
        <span className="ml-3 font-medium text-gray-800 dark:text-gray-200">Animate Image</span>
      </label>
      <div className="ml-2 text-sm text-gray-500 dark:text-gray-400">(Pan, zoom, and move the image over time)</div>
    </div>
  );
}

