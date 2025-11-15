/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from 'react';
import { DisplayInfo } from '../../../../../types';
import { ImageDetails, Transform } from '../types';
import { ApplyTransformOptions } from '../hooks/useImageAnimationControls';

interface ImagePreviewPanelProps {
  panelInfo: DisplayInfo | null;
  imageData: ImageDetails | null;
  previewImageUrl: string | null;
  renderTransform: Transform;
  minScale: number;
  uploading: boolean;
  isPlaying: boolean;
  onScaleChange: (value: number) => void;
  onTransformChange: (transform: Transform, options?: ApplyTransformOptions) => void;
  onFileSelect: (files: FileList | null) => Promise<void>;
}

export default function ImagePreviewPanel({
  panelInfo,
  imageData,
  previewImageUrl,
  renderTransform,
  minScale,
  uploading,
  isPlaying,
  onScaleChange,
  onTransformChange,
  onFileSelect
}: ImagePreviewPanelProps) {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    pointerId: number;
    isDragging: boolean;
    lastX: number;
    lastY: number;
    scale: number;
    currentPointerX: number;
    currentPointerY: number;
  } | null>(null);
  const axisLockRef = useRef<{ axis: 'x' | 'y'; lockedValue: number } | null>(null);
  const dragCounterRef = useRef(0);
  const [dragActive, setDragActive] = useState(false);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (!previewRef.current || !imageData || dragActive || isPlaying) return;
      event.preventDefault();
      previewRef.current.setPointerCapture(event.pointerId);
      dragStateRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        initialX: imageData.transform.x,
        initialY: imageData.transform.y,
        pointerId: event.pointerId,
        isDragging: false,
        lastX: imageData.transform.x,
        lastY: imageData.transform.y,
        scale: imageData.transform.scale,
        currentPointerX: event.clientX,
        currentPointerY: event.clientY
      };
      axisLockRef.current = null;
    },
    [dragActive, imageData, isPlaying]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (!dragStateRef.current || !previewRef.current || !panelInfo || dragActive) return;
      dragStateRef.current.currentPointerX = event.clientX;
      dragStateRef.current.currentPointerY = event.clientY;
      const boundsEl = previewRef.current;
      const ratioX = panelInfo.width / Math.max(1, boundsEl.clientWidth);
      const ratioY = panelInfo.height / Math.max(1, boundsEl.clientHeight);
      const deltaPanelX = (event.clientX - dragStateRef.current.startX) * ratioX;
      const deltaPanelY = (event.clientY - dragStateRef.current.startY) * ratioY;

      const distance = Math.hypot(deltaPanelX, deltaPanelY);
      if (!dragStateRef.current.isDragging) {
        if (distance < 1.5) {
          return;
        }
        dragStateRef.current.isDragging = true;
      }

      let nextX = Math.round(dragStateRef.current.initialX + deltaPanelX);
      let nextY = Math.round(dragStateRef.current.initialY + deltaPanelY);
      const axisLock = axisLockRef.current;
      if (axisLock?.axis === 'x') {
        nextY = axisLock.lockedValue;
      } else if (axisLock?.axis === 'y') {
        nextX = axisLock.lockedValue;
      }
      if (dragStateRef.current.lastX === nextX && dragStateRef.current.lastY === nextY) {
        return;
      }

      onTransformChange(
        {
          x: nextX,
          y: nextY,
          scale: dragStateRef.current.scale ?? imageData?.transform.scale ?? 1
        },
        { createKeyframe: Boolean(imageData?.animation) }
      );

      dragStateRef.current.lastX = nextX;
      dragStateRef.current.lastY = nextY;
    },
    [dragActive, imageData?.animation, imageData?.transform.scale, onTransformChange, panelInfo]
  );

  const handlePointerUp = useCallback((event: React.PointerEvent) => {
    if (previewRef.current) {
      try {
        previewRef.current.releasePointerCapture(event.pointerId);
      } catch {
        // ignore
      }
    }
    dragStateRef.current = null;
    axisLockRef.current = null;
  }, []);

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current += 1;
    setDragActive(true);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      dragCounterRef.current = 0;
      setDragActive(false);
      const files = event.dataTransfer?.files;
      if (files && files.length > 0) {
        void onFileSelect(files);
        event.dataTransfer.clearData();
      }
    },
    [onFileSelect]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (!dragStateRef.current || !dragStateRef.current.isDragging) {
        return;
      }
      if (key === 'x' || key === 'y') {
        axisLockRef.current = {
          axis: key,
          lockedValue: key === 'x' ? dragStateRef.current.lastY : dragStateRef.current.lastX
        };
        event.preventDefault();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (axisLockRef.current && axisLockRef.current.axis === key) {
        if (dragStateRef.current) {
          if (key === 'x') {
            dragStateRef.current.startY = dragStateRef.current.currentPointerY;
            dragStateRef.current.initialY = dragStateRef.current.lastY;
          } else {
            dragStateRef.current.startX = dragStateRef.current.currentPointerX;
            dragStateRef.current.initialX = dragStateRef.current.lastX;
          }
        }
        axisLockRef.current = null;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleUploadClick = useCallback(() => {
    if (imageData?.image_id) {
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      void onFileSelect(target.files);
    };
    input.click();
  }, [imageData?.image_id, onFileSelect]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 flex items-center">
          <span className="p-1 bg-indigo-100 dark:bg-indigo-900/20 rounded mr-2 text-indigo-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                clipRule="evenodd"
              />
            </svg>
          </span>
          Image Preview
        </h3>
        {panelInfo && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Panel: {panelInfo.width} × {panelInfo.height}px
          </span>
        )}
      </div>
      <div
        ref={previewRef}
        className={`relative w-full border-2 border-dashed rounded-lg overflow-hidden touch-none transition-colors ${
          dragActive
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
            : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900'
        } ${!imageData?.image_id ? 'cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20' : ''}`}
        style={{
          aspectRatio: panelInfo ? `${panelInfo.width} / ${panelInfo.height}` : '2 / 1'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleUploadClick}
      >
        {previewImageUrl && panelInfo && imageData ? (
          (() => {
            const scaledWidthPx = Math.round(imageData.natural_width * renderTransform.scale);
            const scaledHeightPx = Math.round(imageData.natural_height * renderTransform.scale);
            return (
              <img
                src={previewImageUrl}
                alt="Preview"
                className="absolute cursor-move select-none"
                style={{
                  width: `${(scaledWidthPx / panelInfo.width) * 100}%`,
                  height: `${(scaledHeightPx / panelInfo.height) * 100}%`,
                  maxWidth: 'none',
                  maxHeight: 'none',
                  left: `${(renderTransform.x / panelInfo.width) * 100}%`,
                  top: `${(renderTransform.y / panelInfo.height) * 100}%`,
                  imageRendering: 'pixelated'
                }}
                draggable={false}
              />
            );
          })()
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {uploading ? 'Uploading...' : 'Click or drag and drop an image to upload'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF up to 30MB</p>
          </div>
        )}
      </div>
      {imageData && (
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Zoom</label>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {Math.round((imageData.transform.scale || 1) * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={Math.round(minScale * 100)}
            max={100}
            step={1}
            value={Math.round((imageData.transform.scale || 1) * 100)}
            onChange={(event) => onScaleChange(Number(event.target.value) / 100)}
            disabled={isPlaying}
            className="mt-2 w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>{Math.round(minScale * 100)}%</span>
            <span>100%</span>
          </div>
        </div>
      )}
    </div>
  );
}

