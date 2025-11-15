'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  fetchPlaylistItem,
  createPlaylistItem,
  updatePlaylistItem,
  uploadImage,
  getImageUrl,
  fetchDisplayInfo,
  updatePreviewContent
} from '../../../../lib/api';
import { ContentType, PlaylistItem, DisplayInfo } from '../../../../types';
import useImagePreview from './hooks/useImagePreview';
import NumberInputControl from '../../common/NumberInputControl';
import BorderEffectSelector from '../../features/BorderEffectSelector/BorderEffectSelector';
import { useBorderEffects } from '../../features/BorderEffectSelector/hooks/useBorderEffects';

interface ImageInputEditorProps {
  itemId: string | null;
  updateStatus: (status: { message: string; type: 'error' | 'success' | 'info' } | null) => void;
  updateSaving: (saving: boolean) => void;
  updateLoading: (loading: boolean) => void;
  onBack?: () => void;
  registerExitPreview?: (exitFn: () => void) => void;
}

type ImageDetails = {
  type: 'Image';
  image_id: string;
  natural_width: number;
  natural_height: number;
  transform: {
    x: number;
    y: number;
    scale: number;
  };
  animation?: {
    keyframes: Array<{
      timestamp_ms: number;
      x: number;
      y: number;
      scale: number;
    }>;
    iterations?: number | null;
  } | null;
};

type Transform = {
  x: number;
  y: number;
  scale: number;
};

const SCALE_DECIMAL_PLACES = 3;
const SCALE_FACTOR = 10 ** SCALE_DECIMAL_PLACES;

const clampScale = (value: number): number => {
  const rounded = Number.isFinite(value) ? Number(value.toFixed(SCALE_DECIMAL_PLACES)) : 1;
  return Math.min(1, Math.max(0.01, rounded));
};

const sanitizeTransform = (transform: Transform): Transform => ({
  x: Math.round(transform.x),
  y: Math.round(transform.y),
  scale: clampScale(transform.scale)
});

const defaultImageForm: Partial<PlaylistItem> = {
  duration: 10,
  border_effect: null,
  content: {
    type: ContentType.Image,
    data: {
      type: 'Image',
      image_id: '',
      natural_width: 0,
      natural_height: 0,
      transform: { x: 0, y: 0, scale: 1 },
      animation: null
    }
  }
};

export default function ImageInputEditor({
  itemId,
  updateStatus,
  updateSaving,
  updateLoading,
  onBack,
  registerExitPreview
}: ImageInputEditorProps) {
  const [form, setForm] = useState<Partial<PlaylistItem>>(defaultImageForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [panelInfo, setPanelInfo] = useState<DisplayInfo | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const playRafRef = useRef<number | null>(null);
  const playStartRef = useRef<number>(0);
  const [dragActive, setDragActive] = useState(false);
  const dragCounterRef = useRef(0);
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
  } | null>(null);
  const wasPlayingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playTransform, setPlayTransform] = useState<{ x: number; y: number; scale: number } | null>(null);
  const [timelineMs, setTimelineMs] = useState(0);
  const [timelineLengthSec, setTimelineLengthSec] = useState(5);
  const timelineDurationMs = useMemo(
    () => Math.max(1, Math.round(timelineLengthSec * 1000)),
    [timelineLengthSec]
  );
  const {
    borderEffectType,
    setBorderEffectType,
    gradientColors,
    handleAddGradientColor,
    handleRemoveGradientColor,
    handleGradientColorEdit,
    getBorderEffectObject
  } = useBorderEffects(form.border_effect || undefined);
  const selectedBorderEffect = useMemo(
    () => getBorderEffectObject(),
    [getBorderEffectObject]
  );
  const imageData = useMemo(() => {
    if (form.content?.type === ContentType.Image && form.content.data.type === 'Image') {
      return form.content.data as ImageDetails;
    }
    return null;
  }, [form]);

  const previewImageUrl = useMemo(() => {
    if (imageData?.image_id) {
      return getImageUrl(imageData.image_id);
    }
    return null;
  }, [imageData?.image_id]);

  const renderTransform = useMemo(() => {
    if (playTransform) return playTransform;
    return imageData?.transform ?? { x: 0, y: 0, scale: 1 };
  }, [playTransform, imageData?.transform]);

  const animationStartTransform = useMemo<Transform | null>(() => {
    const first = imageData?.animation?.keyframes?.[0];
    if (!first) {
      return null;
    }
    return { x: first.x, y: first.y, scale: first.scale };
  }, [imageData?.animation?.keyframes]);

  const previewTransformForPanel = useMemo<Transform>(() => {
    if (isPlaying && animationStartTransform) {
      return animationStartTransform;
    }
    return renderTransform;
  }, [isPlaying, animationStartTransform, renderTransform]);

  // Calculate the minimum scale needed to fit the image in the panel
  const minScale = useMemo(() => {
    if (!imageData || !panelInfo) return 0.01;
    const scaleX = panelInfo.width / imageData.natural_width;
    const scaleY = panelInfo.height / imageData.natural_height;
    const fitScale = Math.min(scaleX, scaleY, 1);
    // Set minimum to half the fit scale (to allow zooming out a bit more), but at least 0.01
    return Math.max(0.01, Math.floor(fitScale * 50) / 100);
  }, [imageData, panelInfo]);

  const computeDefaultTransform = useCallback(
    (data?: ImageDetails | null): Transform => {
      if (!data) {
        return { x: 0, y: 0, scale: 1 };
      }

      if (!panelInfo) {
        return sanitizeTransform(data.transform);
      }

      const width = Math.max(1, data.natural_width);
      const height = Math.max(1, data.natural_height);
      const fitScale = Math.min(panelInfo.width / width, panelInfo.height / height, 1);

      let x = 0;
      let y = 0;

      if (fitScale < 1) {
        const scaledWidth = width * fitScale;
        const scaledHeight = height * fitScale;
        x = Math.round((panelInfo.width - scaledWidth) / 2);
        y = Math.round((panelInfo.height - scaledHeight) / 2);
      }

      return sanitizeTransform({ x, y, scale: fitScale });
    },
    [panelInfo]
  );

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

  // Build a form for previewing on the panel:
  // - Never include animation when previewing. We only send transforms so the panel mirrors
  //   what we see locally, and we only persist animations on save.
  // - Always use the current renderTransform (scrubbed, static, or playing).
  const previewFormData = useMemo<Partial<PlaylistItem>>(() => {
    const base: Partial<PlaylistItem> = {
      ...form,
      border_effect: selectedBorderEffect
    };
    if (base.content?.type === ContentType.Image && base.content.data.type === 'Image') {
      const includeAnimation =
        isPlaying && Boolean(preparedAnimation?.keyframes?.length);
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

  const getAnimationCycleLengthMs = useCallback((): number => {
    const keyframes = preparedAnimation?.keyframes;
    const last = keyframes?.[keyframes.length - 1];
    return last ? Math.max(1, last.timestamp_ms) : 0;
  }, [preparedAnimation]);

  const interpolateTransform = useCallback(
    (elapsedMs: number): { x: number; y: number; scale: number } => {
      const kf = preparedAnimation?.keyframes;
      if (!kf || kf.length < 2) {
        return imageData?.transform ?? { x: 0, y: 0, scale: 1 };
      }
      // Find current segment
      let prev = kf[0];
      for (let i = 1; i < kf.length; i++) {
        const next = kf[i];
        if (elapsedMs <= next.timestamp_ms) {
          const segment = Math.max(1, next.timestamp_ms - prev.timestamp_ms);
          const t = Math.max(0, Math.min(1, (elapsedMs - prev.timestamp_ms) / segment));
          const lerp = (a: number, b: number, tVal: number) => a + (b - a) * tVal;
          const scale = Math.max(0.01, lerp(prev.scale, next.scale, t));
          const x = Number(lerp(prev.x, next.x, t).toFixed(3));
          const y = Number(lerp(prev.y, next.y, t).toFixed(3));
          return { x, y, scale };
        }
        prev = next;
      }
      // Past end => last keyframe
      return { x: prev.x, y: prev.y, scale: Math.max(0.01, prev.scale) };
    },
    [preparedAnimation, imageData?.transform]
  );

  const stopPlayback = useCallback(() => {
    if (playRafRef.current != null) {
      cancelAnimationFrame(playRafRef.current);
      playRafRef.current = null;
    }
    setIsPlaying(false);
    setPlayTransform(null);
  }, []);

  const startPlayback = useCallback(async () => {
    if (!imageData?.animation || (imageData.animation.keyframes?.length ?? 0) < 2) return;
    const cycle = getAnimationCycleLengthMs();
    if (cycle <= 0) return;

    setTimelineMs(0);
    setIsPlaying(true);
    playStartRef.current = performance.now();

    // Determine max iterations (0 or null => infinite)
    const configuredIterations =
      (form.repeat_count ?? imageData.animation.iterations ?? 1) || 0;

    const tick = () => {
      const now = performance.now();
      const elapsedTotal = now - playStartRef.current;
      if (configuredIterations > 0) {
        const totalDuration = configuredIterations * cycle;
        if (elapsedTotal >= totalDuration) {
          // End reached
          setTimelineMs(cycle);
          setPlayTransform(interpolateTransform(cycle)); // snap to end
          stopPlayback();
          return;
        }
      }
      const within = cycle > 0 ? (elapsedTotal % cycle) : 0;
      setTimelineMs(within);
      setPlayTransform(interpolateTransform(within));
      playRafRef.current = requestAnimationFrame(tick);
    };

    playRafRef.current = requestAnimationFrame(tick);
  }, [form.repeat_count, getAnimationCycleLengthMs, imageData?.animation, interpolateTransform, stopPlayback]);

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
    updateSaving(saving);
  }, [saving, updateSaving]);

  useEffect(() => {
    updateLoading(loading);
  }, [loading, updateLoading]);

  useEffect(() => {
    if (registerExitPreview) {
      registerExitPreview(stopRemotePreview);
    }
  }, [stopRemotePreview, registerExitPreview]);

  // Stop local playback if animation gets disabled or component unmounts
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

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        const displayPromise = fetchDisplayInfo();

        if (itemId) {
          const [display, item] = await Promise.all([displayPromise, fetchPlaylistItem(itemId)]);
          if (!isMounted) return;
          setPanelInfo(display);
          setForm(item);
        } else {
          const display = await displayPromise;
          if (!isMounted) return;
          setPanelInfo(display);
          setForm(defaultImageForm);
        }
      } catch (error) {
        if (isMounted) {
          updateStatus({
            message: `Error loading editor: ${error instanceof Error ? error.message : 'Unknown error'}`,
            type: 'error'
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [itemId, updateStatus]);

  const handleFileChange = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      setUploading(true);
      try {
        const response = await uploadImage(file);
        const nextImageData: ImageDetails = {
          type: 'Image',
          image_id: response.image_id,
          natural_width: response.width,
          natural_height: response.height,
          transform: { x: 0, y: 0, scale: 1 },
          animation: null
        };

        const initialTransform = computeDefaultTransform(nextImageData);

        setForm((prev) => ({
          ...prev,
          content: {
            type: ContentType.Image,
            data: {
              ...nextImageData,
              transform: initialTransform,
              animation: prev.content?.data.type === 'Image' ? prev.content.data.animation : null
            }
          }
        }));
        updateStatus({ message: 'Image uploaded successfully', type: 'success' });
      } catch (error) {
        updateStatus({
          message: `Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`,
          type: 'error'
        });
      } finally {
        setUploading(false);
      }
    },
    [computeDefaultTransform, updateStatus]
  );

  const applyTransformChange = useCallback(
    (
      nextTransform: Transform,
      options: { createKeyframe?: boolean; timestampMs?: number; clearPlayTransform?: boolean } = {}
    ) => {
      const { createKeyframe = false, timestampMs, clearPlayTransform = true } = options;
      setForm((prev) => {
        if (prev.content?.data.type !== 'Image') return prev;

        const sanitizedTransform: Transform = {
          x: Math.round(nextTransform.x),
          y: Math.round(nextTransform.y),
          scale: Number.isFinite(nextTransform.scale)
            ? Number(nextTransform.scale.toFixed(2))
            : prev.content.data.transform.scale
        };

        const prevTransform = prev.content.data.transform;
        const transformChanged =
          prevTransform.x !== sanitizedTransform.x ||
          prevTransform.y !== sanitizedTransform.y ||
          prevTransform.scale !== sanitizedTransform.scale;

        let animation = prev.content.data.animation;
        let animationChanged = false;

        if (createKeyframe && animation) {
          const targetTimestamp = Math.max(0, Math.round(timestampMs ?? timelineMs));
          let replaced = false;
          const updatedKeyframes = animation.keyframes.map((keyframe) => {
            if (keyframe.timestamp_ms === targetTimestamp) {
              replaced = true;
              if (
                keyframe.x !== sanitizedTransform.x ||
                keyframe.y !== sanitizedTransform.y ||
                keyframe.scale !== sanitizedTransform.scale
              ) {
                animationChanged = true;
                return {
                  ...keyframe,
                  timestamp_ms: targetTimestamp,
                  x: sanitizedTransform.x,
                  y: sanitizedTransform.y,
                  scale: sanitizedTransform.scale
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
              x: sanitizedTransform.x,
              y: sanitizedTransform.y,
              scale: sanitizedTransform.scale
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
              transform: transformChanged ? sanitizedTransform : prev.content.data.transform,
              animation
            }
          }
        };
      });

      if (clearPlayTransform) {
        setPlayTransform(null);
      }
    },
    [timelineMs, setForm, setPlayTransform]
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
  }, []);

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
  }, [computeDefaultTransform, refreshRemotePreview, stopPlayback]);

  const handleKeyframeTimeSetToCurrent = useCallback((index: number, timestampMs: number) => {
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
  }, []);

  const handleSkipToKeyframe = useCallback(
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
    // Snapshot current preview transform (animated if playing, otherwise form transform)
    const snapshot = {
      x: renderTransform.x,
      y: renderTransform.y,
      scale: Number(renderTransform.scale.toFixed(2))
    };
    setForm((prev) => {
      if (prev.content?.data.type !== 'Image') return prev;
      const animation = prev.content.data.animation;
      if (!animation) return prev;
      // If a keyframe exists at this timestamp, replace it; otherwise append
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
  }, [imageData, renderTransform, timelineMs]);

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
    [resetAnimationToDefault]
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
  }, []);

  const handleDurationChange = useCallback((value: number) => {
    setForm((prev) => ({
      ...prev,
      duration: Math.max(1, Math.round(value))
    }));
  }, []);

  const handleBorderEffectChange = useCallback(
    (effect: string) => {
      setBorderEffectType(effect);
      refreshRemotePreview();
    },
    [setBorderEffectType, refreshRemotePreview]
  );

  useEffect(() => {
    const handleSave = async () => {
      if (!imageData || !imageData.image_id) {
        updateStatus({ message: 'Please upload an image first', type: 'error' });
        return;
      }

      setSaving(true);
      try {
        const payload: Partial<PlaylistItem> = (() => {
          if (form.content?.type !== ContentType.Image || form.content.data.type !== 'Image') {
            return form;
          }
          const animationWithVirtual = ensureVirtualTimelineAnimation(form.content.data.animation);
          if (!animationWithVirtual || animationWithVirtual === form.content.data.animation) {
            return form;
          }
          return {
            ...form,
            content: {
              ...form.content,
              data: {
                ...form.content.data,
                animation: animationWithVirtual
              }
            }
          };
        })();
        payload.border_effect = selectedBorderEffect;

        if (itemId) {
          await updatePlaylistItem(itemId, payload);
        } else {
          await createPlaylistItem(payload);
        }
        updateStatus({ message: 'Playlist item saved', type: 'success' });
        stopRemotePreview();
        if (onBack) {
          onBack();
        }
      } catch (error) {
        updateStatus({
          message: `Error saving item: ${error instanceof Error ? error.message : 'Unknown error'}`,
          type: 'error'
        });
      } finally {
        setSaving(false);
      }
    };

    const listener = () => {
      void handleSave();
    };

    document.addEventListener('editor-save', listener);
    return () => {
      document.removeEventListener('editor-save', listener);
    };
  }, [
    ensureVirtualTimelineAnimation,
    form,
    imageData,
    itemId,
    onBack,
    selectedBorderEffect,
    stopRemotePreview,
    updateStatus
  ]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (!previewRef.current || !imageData || dragActive || isPlaying) return;
      event.preventDefault();
      // Capture the pointer on the preview container so we reliably get move/up events
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
        scale: imageData.transform.scale
      };
    },
    [imageData, dragActive, isPlaying]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (!dragStateRef.current || !previewRef.current || !panelInfo || dragActive) return;
      const boundsEl = previewRef.current;
      // Use clientWidth/Height to avoid including borders in the measurement
      const ratioX = panelInfo.width / Math.max(1, boundsEl.clientWidth);
      const ratioY = panelInfo.height / Math.max(1, boundsEl.clientHeight);
      const deltaPanelX = (event.clientX - dragStateRef.current.startX) * ratioX;
      const deltaPanelY = (event.clientY - dragStateRef.current.startY) * ratioY;

      // Start dragging only after a minimal movement threshold (in panel pixels)
      const distance = Math.hypot(deltaPanelX, deltaPanelY);
      if (!dragStateRef.current.isDragging) {
        if (distance < 1.5) {
          return;
        }
        dragStateRef.current.isDragging = true;
      }

      const nextX = Math.round(dragStateRef.current.initialX + deltaPanelX);
      const nextY = Math.round(dragStateRef.current.initialY + deltaPanelY);
      if (dragStateRef.current.lastX === nextX && dragStateRef.current.lastY === nextY) {
        return;
      }

      applyTransformChange(
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
    [panelInfo, dragActive, applyTransformChange, imageData]
  );

  const handlePointerUp = useCallback((event: React.PointerEvent) => {
    if (previewRef.current) {
      try {
        previewRef.current.releasePointerCapture(event.pointerId);
      } catch {
        // ignore if capture was already released
      }
    }
    dragStateRef.current = null;
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
    // Show copy cursor
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
        void handleFileChange(files);
        event.dataTransfer.clearData();
      }
    },
    [handleFileChange]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-2"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 flex items-center">
            <span className="p-1 bg-indigo-100 dark:bg-indigo-900/20 rounded mr-2 text-indigo-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
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
          onClick={() => {
            if (!imageData?.image_id) {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e) => {
                const target = e.target as HTMLInputElement;
                handleFileChange(target.files);
              };
              input.click();
            }
          }}
        >
          {previewImageUrl && panelInfo && imageData ? (
            (() => {
              // Match renderer behavior: round scaled dimensions to whole panel pixels
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
                    // Override Tailwind preflight (img { max-width: 100% }) so zoom > 100% works
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
              <p className="text-xs text-gray-500 dark:text-gray-400">
                PNG, JPG, GIF up to 30MB
              </p>
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
              onChange={(event) => updateTransform('scale', Number(event.target.value) / 100)}
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

      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 my-6">
        <div className="flex items-center mb-5">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="animation"
              name="animation"
              checked={!!imageData?.animation}
              onChange={(e) => (e.target.checked ? ensureAnimation() : disableAnimation())}
              disabled={!imageData}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            <span className="ml-3 font-medium text-gray-800 dark:text-gray-200">Animate Image</span>
          </label>
          <div className="ml-2 text-sm text-gray-500 dark:text-gray-400">
            (Pan, zoom, and move the image over time)
          </div>
        </div>

        {/* Animation controls */}
        <div className={`transition-all duration-300 ease-in-out ${imageData?.animation ? 'max-h-[2000px] opacity-100 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden invisible'}`}>
          {imageData?.animation && (
          <>
            <div className="space-y-4">
              {/* Timeline scrubber */}
              <div>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Timeline</label>
                  {imageData.animation?.keyframes && imageData.animation.keyframes.length > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {imageData.animation.keyframes.length} keyframe{imageData.animation.keyframes.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    {/* Keyframe indicators */}
                    <div className="absolute top-0 left-0 right-0 h-6 pointer-events-none">
                      {imageData.animation?.keyframes?.map((keyframe, idx) => {
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
                      onChange={(e) => {
                        const next = Number(e.target.value);
                        setTimelineMs(next);
                        // Scrub local preview
                        const scrubbed = interpolateTransform(next);
                        setPlayTransform(scrubbed);
                        setIsPlaying(false);
                        applyTransformChange(scrubbed, { clearPlayTransform: false });
                      }}
                      className="w-full relative z-10"
                    />
                  </div>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition flex-shrink-0"
                    onClick={isPlaying ? stopPlayback : startPlayback}
                    disabled={(imageData.animation?.keyframes.length ?? 0) < 2 && !isPlaying}
                  >
                    {isPlaying ? 'Stop' : 'Play'}
                  </button>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {`${(timelineMs / 1000).toFixed(2)}s / ${timelineLengthSec.toFixed(1)}s`}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NumberInputControl
                  label="Number of Repeats"
                  value={imageData.animation?.iterations ?? form.repeat_count ?? 1}
                  onChange={handleIterationsChange}
                  suffix="times"
                  minValue={0}
                  defaultValue={1}
                  className="mb-0"
                />
                <NumberInputControl
                  label="Timeline Length"
                  value={timelineLengthSec}
                  onChange={(value) => {
                    setTimelineLengthSec(value);
                    // If current timeline position is beyond new length, reset it
                    if (timelineMs > value * 1000) {
                      const clamped = value * 1000;
                      setTimelineMs(clamped);
                      const scrubbed = interpolateTransform(clamped);
                      setPlayTransform(scrubbed);
                      setIsPlaying(false);
                      applyTransformChange(scrubbed, { clearPlayTransform: false });
                    }
                  }}
                  suffix="seconds"
                  minValue={(() => {
                    // Calculate minimum based on last keyframe
                    const keyframes = imageData.animation?.keyframes;
                    if (keyframes && keyframes.length > 0) {
                      const lastKeyframe = keyframes[keyframes.length - 1];
                      const lastKeyframeSeconds = Math.ceil(lastKeyframe.timestamp_ms / 1000);
                      return Math.max(1, lastKeyframeSeconds);
                    }
                    return 1;
                  })()}
                  maxValue={60}
                  defaultValue={5}
                  className="mb-0"
                />
              </div>

              {/* Keyframe list */}
              {imageData.animation?.keyframes && imageData.animation.keyframes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Keyframes</h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className="px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-500/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 disabled:opacity-50"
                        onClick={handleAddKeyframe}
                        disabled={!imageData}
                      >
                        + Add Keyframe at Current Time
                      </button>
                      <button
                        type="button"
                        className="px-3 py-2 rounded-lg border border-red-200 dark:border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                        onClick={resetAnimationToDefault}
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {imageData.animation.keyframes
                      .slice()
                      .sort((a, b) => a.timestamp_ms - b.timestamp_ms)
                      .map((keyframe, idx) => (
                    <div
                      key={`${keyframe.timestamp_ms}-${idx}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSkipToKeyframe(keyframe.timestamp_ms)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleSkipToKeyframe(keyframe.timestamp_ms);
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
                      
                      {/* Action buttons */}
                      <div 
                        className="absolute right-0 top-0 h-full flex opacity-70 group-hover:opacity-100 transition-opacity" 
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="flex items-center justify-center w-12 h-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleKeyframeTimeSetToCurrent(idx, timelineMs);
                          }}
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
                          onClick={(event) => {
                            event.stopPropagation();
                            handleRemoveKeyframe(idx);
                          }}
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
              )}
            </div>
          </>
          )}
        </div>

        {/* Static duration control */}
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${!imageData?.animation ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 invisible'}`}>
          <NumberInputControl
            label="Duration (seconds)"
            value={form.duration || 10}
            onChange={handleDurationChange}
            suffix="seconds"
            minValue={1}
            defaultValue={10}
          />
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

