import { ImageKeyframe } from '../../types';

interface TimelineScrubberProps {
  timelineMs: number;
  timelineLengthSec: number;
  keyframes?: ImageKeyframe[];
  isPlaying: boolean;
  canPlay: boolean;
  onScrub: (value: number) => void;
  onStartPlayback: () => void;
  onStopPlayback: () => void;
}

export default function TimelineScrubber({
  timelineMs,
  timelineLengthSec,
  keyframes,
  isPlaying,
  canPlay,
  onScrub,
  onStartPlayback,
  onStopPlayback
}: TimelineScrubberProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Timeline</label>
        {keyframes && keyframes.length > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {keyframes.length} keyframe{keyframes.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <div className="absolute top-0 left-0 right-0 h-6 pointer-events-none">
            {keyframes?.map((keyframe, idx) => {
              const position = (keyframe.timestamp_ms / (timelineLengthSec * 1000)) * 100;
              return (
                <div
                  key={`indicator-${keyframe.timestamp_ms}-${idx}`}
                  className="absolute top-0 w-0.5 h-6 bg-indigo-500 dark:bg-indigo-400"
                  style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                  title={`Keyframe at ${(keyframe.timestamp_ms / 1000).toFixed(2)}s`}
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400"></div>
                </div>
              );
            })}
          </div>
          <input
            type="range"
            min={0}
            max={timelineLengthSec * 1000}
            step={10}
            value={timelineMs}
            onChange={(event) => onScrub(Number(event.target.value))}
            className="w-full relative z-10"
          />
        </div>
        <button
          type="button"
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition flex-shrink-0"
          onClick={isPlaying ? onStopPlayback : onStartPlayback}
          disabled={!canPlay && !isPlaying}
        >
          {isPlaying ? 'Stop' : 'Play'}
        </button>
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {`${(timelineMs / 1000).toFixed(2)}s / ${timelineLengthSec.toFixed(1)}s`}
      </div>
    </div>
  );
}

