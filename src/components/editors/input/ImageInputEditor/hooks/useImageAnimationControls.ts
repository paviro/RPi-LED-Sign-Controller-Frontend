import { useCallback, useEffect, useMemo, useRef, useState, Dispatch, SetStateAction } from 'react';
import { ContentType, PlaylistItem, DisplayInfo } from '../../../../../types';
import useImagePreview from './useImagePreview';
import { ImageDetails, Transform } from '../types';

interface UseImageAnimationControlsParams {
  form: Partial<PlaylistItem>;
  setForm: Dispatch<SetStateAction<Partial<PlaylistItem>>>;
  imageData: ImageDetails | null;
  panelInfo: DisplayInfo | null;
  selectedBorderEffect: PlaylistItem['border_effect'];
  computeDefaultTransform: (data?: ImageDetails | null) => Transform;
  registerExitPreview?: (exitFn: () => void) => void;
  loading: boolean;
  uploading: boolean;
}

export interface ApplyTransformOptions {
  createKeyframe?: boolean;
  timestampMs?: number;
  clearPlayTransform?: boolean;
}

export interface ImageAnimationControls {
  timelineMs: number;
  timelineLengthSec: number;
  isPlaying: boolean;
  renderTransform: Transform;
  previewTransformForPanel: Transform;
  preparedAnimation: ImageDetails['animation'] | null | undefined;
  minScale: number;
  applyTransformChange: (nextTransform: Transform, options?: ApplyTransformOptions) => void;
  updateTransform: (field: 'x' | 'y' | 'scale', value: number) => void;
  ensureAnimation: () => void;
  disableAnimation: () => void;
  resetAnimationToDefault: () => void;
  handleIterationsChange: (value: number) => void;
  handleTimelineScrub: (timestampMs: number) => void;
  handleSkipToKeyframe: (timestampMs: number) => void;
  handleAddKeyframe: () => void;
  handleRemoveKeyframe: (index: number) => void;
  handleKeyframeTimeSetToCurrent: (index: number, timestampMs: number) => void;
  handleTimelineLengthChange: (value: number) => void;
  startPlayback: () => void;
  stopPlayback: () => void;
  refreshRemotePreview: () => void;
  stopRemotePreview: () => void;
  playRemotePreviewFromStart: () => Promise<void>;
  ensureVirtualTimelineAnimation: (
    animation: ImageDetails['animation'] | null | undefined
  ) => ImageDetails['animation'] | null;
}

export function useImageAnimationControls({
  form,
  setForm,
  imageData,
  panelInfo,
  selectedBorderEffect,
  computeDefaultTransform,
  registerExitPreview,
  loading,
  uploading
}: UseImageAnimationControlsParams): ImageAnimationControls {
  const [timelineMs, setTimelineMs] = useState(0);
  const [timelineLengthSec, setTimelineLengthSec] = useState(5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playTransform, setPlayTransform] = useState<Transform | null>(null);
  const playRafRef = useRef<number | null>(null);
  const playStartRef = useRef<number>(0);
  const wasPlayingRef = useRef(false);

  const timelineDurationMs = useMemo(
    () => Math.max(1, Math.round(timelineLengthSec * 1000)),
    [timelineLengthSec]
  );

  const animationStartTransform = useMemo<Transform | null>(() => {
    const first = imageData?.animation?.keyframes?.[0];
    if (!first) {
      return null;
    }
    return { x: first.x, y: first.y, scale: first.scale };
  }, [imageData?.animation?.keyframes]);

  const renderTransform = useMemo<Transform>(() => {
    if (playTransform) {
      return playTransform;
    }
    if (imageData?.transform) {
      return imageData.transform;
    }
    return { x: 0, y: 0, scale: 1 };
  }, [imageData?.transform, playTransform]);

  const previewTransformForPanel = useMemo<Transform>(() => {
    if (isPlaying && animationStartTransform) {
      return animationStartTransform;
    }
    return renderTransform;
  }, [animationStartTransform, isPlaying, renderTransform]);

  const minScale = useMemo(() => {
    if (!imageData || !panelInfo) return 0.01;
    const scaleX = panelInfo.width / imageData.natural_width;
    const scaleY = panelInfo.height / imageData.natural_height;
    const fitScale = Math.min(scaleX, scaleY, 1);
    return Math.max(0.01, Math.floor(fitScale * 50) / 100);
  }, [imageData, panelInfo]);

  const ensureVirtualTimelineAnimation = useCallback(
    (animation: ImageDetails['animation'] | null | undefined): ImageDetails['animation'] | null => {
      if (!animation || !animation.keyframes?.length) {
        return animation ?? null;
      }
      const keyframes = animation.keyframes;
      const lastKeyframe = keyframes[keyframes.length - 1];
      if (!lastKeyframe || timelineDurationMs <= lastKeyframe.timestamp_ms) {
        return animation;
      }
      return {
        ...animation,
        keyframes: [
          ...keyframes,
          {
            ...lastKeyframe,
            timestamp_ms: timelineDurationMs
          }
        ]
      };
    },
    [timelineDurationMs]
  );

  const preparedAnimation = useMemo(
    () => ensureVirtualTimelineAnimation(imageData?.animation),
    [imageData?.animation, ensureVirtualTimelineAnimation]
  );

  const previewFormData = useMemo<Partial<PlaylistItem>>(() => {
    const base: Partial<PlaylistItem> = {
      ...form,
      border_effect: selectedBorderEffect
    };
    if (base.content?.type === ContentType.Image && base.content.data.type === 'Image') {
      const includeAnimation = isPlaying && Boolean(preparedAnimation?.keyframes?.length);
      base.content = {
        ...base.content,
        data: {
          ...base.content.data,
          transform: {
            x: previewTransformForPanel.x,
            y: previewTransformForPanel.y,
            scale: previewTransformForPanel.scale
          },
          animation: includeAnimation ? preparedAnimation : null
        }
      };
    }
    return base;
  }, [form, isPlaying, preparedAnimation, previewTransformForPanel, selectedBorderEffect]);

  const {
    stopPreview: stopRemotePreview,
    refreshPreview: refreshRemotePreview,
    playFromStart: playRemotePreviewFromStart
  } = useImagePreview({
    formData: previewFormData,
    loading: loading || uploading
  });

  const stopPlayback = useCallback(() => {
    if (playRafRef.current != null) {
      cancelAnimationFrame(playRafRef.current);
      playRafRef.current = null;
    }
    setIsPlaying(false);
    setPlayTransform(null);
  }, []);

  useEffect(() => {
    if (!imageData?.animation) {
      wasPlayingRef.current = false;
      return;
    }
    if (isPlaying && !wasPlayingRef.current) {
      wasPlayingRef.current = true;
      void playRemotePreviewFromStart();
    } else if (!isPlaying && wasPlayingRef.current) {
      wasPlayingRef.current = false;
      refreshRemotePreview();
    }
  }, [imageData?.animation, isPlaying, playRemotePreviewFromStart, refreshRemotePreview]);

  useEffect(() => {
    if (registerExitPreview) {
      registerExitPreview(stopRemotePreview);
    }
  }, [registerExitPreview, stopRemotePreview]);

  useEffect(() => {
    if (!imageData?.animation && isPlaying) {
      stopPlayback();
    }
    return () => {
      if (isPlaying) {
        stopPlayback();
      }
    };
  }, [imageData?.animation, isPlaying, stopPlayback]);

  const getAnimationCycleLengthMs = useCallback((): number => {
    const keyframes = preparedAnimation?.keyframes;
    const last = keyframes?.[keyframes.length - 1];
    return last ? Math.max(1, last.timestamp_ms) : 0;
  }, [preparedAnimation]);

  const interpolateTransform = useCallback(
    (elapsedMs: number): Transform => {
      const keyframes = preparedAnimation?.keyframes;
      if (!keyframes || keyframes.length < 2) {
        return imageData?.transform ?? { x: 0, y: 0, scale: 1 };
      }
      let previous = keyframes[0];
      for (let i = 1; i < keyframes.length; i++) {
        const next = keyframes[i];
        if (elapsedMs <= next.timestamp_ms) {
          const segment = Math.max(1, next.timestamp_ms - previous.timestamp_ms);
          const t = Math.max(0, Math.min(1, (elapsedMs - previous.timestamp_ms) / segment));
          const lerp = (a: number, b: number, rate: number) => a + (b - a) * rate;
          const scale = Math.max(0.01, lerp(previous.scale, next.scale, t));
          const x = Number(lerp(previous.x, next.x, t).toFixed(3));
          const y = Number(lerp(previous.y, next.y, t).toFixed(3));
          return { x, y, scale };
        }
        previous = next;
      }
      return { x: previous.x, y: previous.y, scale: Math.max(0.01, previous.scale) };
    },
    [preparedAnimation, imageData?.transform]
  );

  const applyTransformChange = useCallback(
    (nextTransform: Transform, options: ApplyTransformOptions = {}) => {
      const { createKeyframe = false, timestampMs, clearPlayTransform = true } = options;
      setForm((prev) => {
        if (prev.content?.data.type !== 'Image') {
          return prev;
        }

        const sanitized: Transform = {
          x: Math.round(nextTransform.x),
          y: Math.round(nextTransform.y),
          scale: Number.isFinite(nextTransform.scale)
            ? Number(nextTransform.scale.toFixed(2))
            : prev.content.data.transform.scale
        };

        const prevTransform = prev.content.data.transform;
        const transformChanged =
          prevTransform.x !== sanitized.x ||
          prevTransform.y !== sanitized.y ||
          prevTransform.scale !== sanitized.scale;

        let animation = prev.content.data.animation;
        let animationChanged = false;

        if (createKeyframe && animation) {
          const targetTimestamp = Math.max(0, Math.round(timestampMs ?? timelineMs));
          let replaced = false;

          const updatedKeyframes = animation.keyframes.map((keyframe) => {
            if (keyframe.timestamp_ms === targetTimestamp) {
              replaced = true;
              if (
                keyframe.x !== sanitized.x ||
                keyframe.y !== sanitized.y ||
                keyframe.scale !== sanitized.scale
              ) {
                animationChanged = true;
                return {
                  ...keyframe,
                  timestamp_ms: targetTimestamp,
                  x: sanitized.x,
                  y: sanitized.y,
                  scale: sanitized.scale
                };
              }
              return keyframe;
            }
            return keyframe;
          });

          if (!replaced) {
            animationChanged = true;
            updatedKeyframes.push({
              timestamp_ms: targetTimestamp,
              x: sanitized.x,
              y: sanitized.y,
              scale: sanitized.scale
            });
          }

          if (animationChanged) {
            animation = {
              ...animation,
              keyframes: updatedKeyframes.sort((a, b) => a.timestamp_ms - b.timestamp_ms)
            };
          }
        }

        if (!transformChanged && !animationChanged) {
          return prev;
        }

        return {
          ...prev,
          content: {
            ...prev.content,
            data: {
              ...prev.content.data,
              transform: transformChanged ? sanitized : prev.content.data.transform,
              animation
            }
          }
        };
      });

      if (clearPlayTransform) {
        setPlayTransform(null);
      }
    },
    [setForm, timelineMs]
  );

  const updateTransform = useCallback(
    (field: 'x' | 'y' | 'scale', value: number) => {
      if (!imageData || !panelInfo) return;

      if (field === 'scale') {
        const oldScale = imageData.transform.scale || 1;
        const newScale = Number(value.toFixed(2));
        const oldX = imageData.transform.x;
        const oldY = imageData.transform.y;
        const centerX = panelInfo.width / 2;
        const centerY = panelInfo.height / 2;
        const newX = Math.round(centerX - ((centerX - oldX) * newScale) / oldScale);
        const newY = Math.round(centerY - ((centerY - oldY) * newScale) / oldScale);

        applyTransformChange(
          {
            x: newX,
            y: newY,
            scale: newScale
          },
          { createKeyframe: Boolean(imageData.animation) }
        );
        return;
      }

      const nextTransform: Transform = {
        x: field === 'x' ? Math.round(value) : imageData.transform.x,
        y: field === 'y' ? Math.round(value) : imageData.transform.y,
        scale: imageData.transform.scale
      };

      applyTransformChange(nextTransform, { createKeyframe: Boolean(imageData.animation) });
    },
    [imageData, panelInfo, applyTransformChange]
  );

  const ensureAnimation = useCallback(() => {
    if (!imageData) return;
    const initialTransform: Transform = {
      x: Math.round(renderTransform.x),
      y: Math.round(renderTransform.y),
      scale: Number(renderTransform.scale.toFixed(2))
    };
    setTimelineMs(0);
    setPlayTransform(null);
    setForm((prev) => {
      if (prev.content?.data.type !== 'Image') return prev;
      const iterations = prev.repeat_count ?? 1;
      const animation = {
        keyframes: [
          {
            timestamp_ms: 0,
            x: initialTransform.x,
            y: initialTransform.y,
            scale: initialTransform.scale
          }
        ],
        iterations
      };

      return {
        ...prev,
        repeat_count: iterations,
        duration: undefined,
        content: {
          ...prev.content,
          data: {
            ...prev.content.data,
            transform: initialTransform,
            animation
          }
        }
      };
    });
  }, [imageData, renderTransform, setForm]);

  const disableAnimation = useCallback(() => {
    setForm((prev) => {
      if (prev.content?.data.type !== 'Image') return prev;
      return {
        ...prev,
        repeat_count: undefined,
        duration: prev.duration ?? 10,
        content: {
          ...prev.content,
          data: {
            ...prev.content.data,
            animation: null
          }
        }
      };
    });
  }, [setForm]);

  const resetAnimationToDefault = useCallback(() => {
    let updated = false;
    let defaultTransform: Transform | null = null;

    setForm((prev) => {
      if (prev.content?.data.type !== 'Image' || !prev.content.data.animation) return prev;
      const nextTransform = computeDefaultTransform(prev.content.data);
      defaultTransform = nextTransform;
      updated = true;

      return {
        ...prev,
        content: {
          ...prev.content,
          data: {
            ...prev.content.data,
            transform: nextTransform,
            animation: {
              ...prev.content.data.animation,
              keyframes: [
                {
                  timestamp_ms: 0,
                  x: nextTransform.x,
                  y: nextTransform.y,
                  scale: nextTransform.scale
                }
              ]
            }
          }
        }
      };
    });

    if (updated && defaultTransform) {
      stopPlayback();
      setTimelineMs(0);
      refreshRemotePreview();
    }
  }, [computeDefaultTransform, refreshRemotePreview, setForm, stopPlayback]);

  const handleKeyframeTimeSetToCurrent = useCallback(
    (index: number, timestampMs: number) => {
      setForm((prev) => {
        if (prev.content?.data.type !== 'Image' || !prev.content.data.animation) return prev;
        const clamped = Math.max(0, Math.round(timestampMs));
        const keyframes = prev.content.data.animation.keyframes
          .map((kf, idx) => (idx === index ? { ...kf, timestamp_ms: clamped } : kf))
          .sort((a, b) => a.timestamp_ms - b.timestamp_ms);
        return {
          ...prev,
          content: {
            ...prev.content,
            data: {
              ...prev.content.data,
              animation: {
                ...prev.content.data.animation,
                keyframes
              }
            }
          }
        };
      });
    },
    [setForm]
  );

  const handleTimelineScrub = useCallback(
    (timestampMs: number) => {
      const maxMs = Math.round(timelineLengthSec * 1000);
      const clamped = Math.max(0, Math.min(Math.round(timestampMs), maxMs));
      setTimelineMs(clamped);
      const scrubbed = interpolateTransform(clamped);
      setPlayTransform(scrubbed);
      setIsPlaying(false);
      applyTransformChange(scrubbed, { clearPlayTransform: false });
    },
    [applyTransformChange, interpolateTransform, timelineLengthSec]
  );

  const handleAddKeyframe = useCallback(() => {
    if (!imageData) return;
    const nextTimestamp = Math.max(0, Math.round(timelineMs));
    const snapshot = {
      x: renderTransform.x,
      y: renderTransform.y,
      scale: Number(renderTransform.scale.toFixed(2))
    };
    setForm((prev) => {
      if (prev.content?.data.type !== 'Image') return prev;
      const animation = prev.content.data.animation;
      if (!animation) return prev;
      let replaced = false;
      const updated = animation.keyframes.map((kf) => {
        if (kf.timestamp_ms === nextTimestamp) {
          replaced = true;
          return {
            timestamp_ms: nextTimestamp,
            x: Math.round(snapshot.x),
            y: Math.round(snapshot.y),
            scale: snapshot.scale
          };
        }
        return kf;
      });
      return {
        ...prev,
        content: {
          ...prev.content,
          data: {
            ...prev.content.data,
            animation: {
              ...animation,
              keyframes: (replaced
                ? updated
                : [
                    ...animation.keyframes,
                    {
                      timestamp_ms: nextTimestamp,
                      x: Math.round(snapshot.x),
                      y: Math.round(snapshot.y),
                      scale: snapshot.scale
                    }
                  ]
              ).sort((a, b) => a.timestamp_ms - b.timestamp_ms)
            }
          }
        }
      };
    });
  }, [imageData, renderTransform, setForm, timelineMs]);

  const handleRemoveKeyframe = useCallback(
    (index: number) => {
      let removedLast = false;

      setForm((prev) => {
        if (prev.content?.data.type !== 'Image' || !prev.content.data.animation) return prev;
        const keyframes = prev.content.data.animation.keyframes;
        if (index < 0 || index >= keyframes.length) {
          return prev;
        }

        if (keyframes.length <= 1) {
          removedLast = true;
          return prev;
        }

        const remaining = keyframes.filter((_, idx) => idx !== index);
        return {
          ...prev,
          content: {
            ...prev.content,
            data: {
              ...prev.content.data,
              animation: {
                ...prev.content.data.animation,
                keyframes: remaining
              }
            }
          }
        };
      });

      if (removedLast) {
        resetAnimationToDefault();
      }
    },
    [resetAnimationToDefault, setForm]
  );

  const handleIterationsChange = useCallback((value: number) => {
    setForm((prev) => {
      if (prev.content?.data.type !== 'Image') return prev;
      const iterations = value <= 0 ? 0 : Math.round(value);
      return {
        ...prev,
        repeat_count: iterations === 0 ? 0 : iterations,
        content: {
          ...prev.content,
          data: {
            ...prev.content.data,
            animation: prev.content.data.animation
              ? { ...prev.content.data.animation, iterations }
              : prev.content.data.animation
          }
        }
      };
    });
  }, [setForm]);

  const handleTimelineLengthChange = useCallback(
    (value: number) => {
      const safeValue = Math.max(1, Math.min(60, Math.round(value)));
      setTimelineLengthSec(safeValue);
      if (timelineMs > safeValue * 1000) {
        const clamped = safeValue * 1000;
        setTimelineMs(clamped);
        const scrubbed = interpolateTransform(clamped);
        setPlayTransform(scrubbed);
        setIsPlaying(false);
        applyTransformChange(scrubbed, { clearPlayTransform: false });
      }
    },
    [applyTransformChange, interpolateTransform, timelineMs]
  );

  const startPlayback = useCallback(() => {
    if (!imageData?.animation || (imageData.animation.keyframes?.length ?? 0) < 2) return;
    const cycle = getAnimationCycleLengthMs();
    if (cycle <= 0) return;

    setTimelineMs(0);
    setIsPlaying(true);
    playStartRef.current = performance.now();

    const configuredIterations =
      (form.repeat_count ?? imageData.animation.iterations ?? 1) || 0;

    const tick = () => {
      const now = performance.now();
      const elapsedTotal = now - playStartRef.current;
      if (configuredIterations > 0) {
        const totalDuration = configuredIterations * cycle;
        if (elapsedTotal >= totalDuration) {
          setTimelineMs(cycle);
          setPlayTransform(interpolateTransform(cycle));
          stopPlayback();
          return;
        }
      }
      const within = cycle > 0 ? elapsedTotal % cycle : 0;
      setTimelineMs(within);
      setPlayTransform(interpolateTransform(within));
      playRafRef.current = requestAnimationFrame(tick);
    };

    playRafRef.current = requestAnimationFrame(tick);
  }, [
    form.repeat_count,
    getAnimationCycleLengthMs,
    imageData?.animation,
    interpolateTransform,
    stopPlayback
  ]);

  return {
    timelineMs,
    timelineLengthSec,
    isPlaying,
    renderTransform,
    previewTransformForPanel,
    preparedAnimation,
    minScale,
    applyTransformChange,
    updateTransform,
    ensureAnimation,
    disableAnimation,
    resetAnimationToDefault,
    handleIterationsChange,
    handleTimelineScrub,
    handleSkipToKeyframe: handleTimelineScrub,
    handleAddKeyframe,
    handleRemoveKeyframe,
    handleKeyframeTimeSetToCurrent,
    handleTimelineLengthChange,
    startPlayback,
    stopPlayback,
    refreshRemotePreview,
    stopRemotePreview,
    playRemotePreviewFromStart,
    ensureVirtualTimelineAnimation
  };
}
