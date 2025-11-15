import { ImageKeyframe } from '../../types';

interface KeyframeListProps {
  keyframes?: ImageKeyframe[];
  timelineMs: number;
  onSkipToKeyframe: (timestampMs: number) => void;
  onMoveToCurrent: (index: number, timestampMs: number) => void;
  onRemove: (index: number) => void;
  onAddKeyframe: () => void;
  onClearAll: () => void;
}

export default function KeyframeList({
  keyframes,
  timelineMs,
  onSkipToKeyframe,
  onMoveToCurrent,
  onRemove,
  onAddKeyframe,
  onClearAll
}: KeyframeListProps) {
  if (!keyframes || keyframes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Keyframes</h3>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="px-3 py-1.5 text-sm rounded-lg border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors disabled:opacity-50"
            onClick={onAddKeyframe}
          >
            + Add Keyframe at Current Time
          </button>
          <button
            type="button"
            className="px-3 py-1.5 text-sm rounded-lg border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            onClick={onClearAll}
          >
            Clear All
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {keyframes
          .slice()
          .sort((a, b) => a.timestamp_ms - b.timestamp_ms)
          .map((keyframe, idx) => (
            <div
              key={`${keyframe.timestamp_ms}-${idx}`}
              role="button"
              tabIndex={0}
              onClick={() => onSkipToKeyframe(keyframe.timestamp_ms)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSkipToKeyframe(keyframe.timestamp_ms);
                }
              }}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/40 px-4 py-3 shadow-sm text-sm cursor-pointer transition-all hover:bg-gray-50 hover:translate-x-0.5 dark:hover:bg-gray-800 relative overflow-hidden group"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200 font-semibold">
                    {idx + 1}
                  </div>
                  <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>
                </div>
                <div className="flex flex-1 items-center justify-between gap-3 pr-24">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Timestamp</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {(keyframe.timestamp_ms / 1000).toFixed(2)}s
                    </p>
                  </div>
                </div>
              </div>
              <div
                className="absolute right-0 top-0 h-full flex opacity-70 group-hover:opacity-100 transition-opacity"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  className="flex items-center justify-center w-12 h-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
                  onClick={() => onMoveToCurrent(idx, timelineMs)}
                  title="Move keyframe to the playhead position"
                  aria-label="Move keyframe to the playhead position"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                    <line x1="19" y1="3" x2="19" y2="21" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center w-12 h-full hover:bg-red-100 dark:hover:bg-red-900 text-red-500 transition-colors"
                  onClick={() => onRemove(idx)}
                  title="Delete keyframe"
                  aria-label="Delete keyframe"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

