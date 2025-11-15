'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import {
  startPreviewMode,
  updatePreviewContent,
  checkPreviewSessionOwnership
} from '../../../../../lib/api';
import { ContentType, PlaylistItem } from '../../../../../types';
import PreviewState from '../../../common/previewState';

interface ImagePreviewOptions {
  formData: Partial<PlaylistItem>;
  loading: boolean;
}

// PreviewState is now shared across editors via ../../../common/previewState

export default function useImagePreview({ formData, loading }: ImagePreviewOptions) {
  const [previewActive, setPreviewActive] = useState(PreviewState.isActive);
  const [sessionExpired, setSessionExpired] = useState(false);
  const mountedRef = useRef(true);

  const imageDetails = useMemo(() => {
    const data = formData.content?.data;
    return data && data.type === 'Image' ? data : null;
  }, [formData.content?.data]);

  const firstKeyframe = useMemo(() => {
    if (!imageDetails?.animation?.keyframes || imageDetails.animation.keyframes.length === 0) {
      return null;
    }
    return imageDetails.animation.keyframes
      .slice()
      .sort((a, b) => a.timestamp_ms - b.timestamp_ms)[0];
  }, [imageDetails?.animation?.keyframes]);

  const normalizedAnimation = useMemo(() => {
    if (!imageDetails?.animation || (imageDetails.animation.keyframes?.length ?? 0) < 2) {
      return null;
    }

    return {
      ...imageDetails.animation,
      keyframes: imageDetails.animation.keyframes
        .slice()
        .sort((a, b) => a.timestamp_ms - b.timestamp_ms)
    };
  }, [imageDetails?.animation]);

  const hasAnimation = useMemo(() => !!normalizedAnimation, [normalizedAnimation]);

  const previewTransform = useMemo(() => {
    if (imageDetails?.transform) {
      return imageDetails.transform;
    }

    if (firstKeyframe) {
      return {
        x: firstKeyframe.x,
        y: firstKeyframe.y,
        scale: firstKeyframe.scale
      };
    }

    return null;
  }, [imageDetails?.transform, firstKeyframe]);

  const sanitizePreviewTransform = useCallback(
    (transform: { x: number; y: number; scale: number }): { x: number; y: number; scale: number } => ({
      x: Math.round(Number.isFinite(transform.x) ? transform.x : 0),
      y: Math.round(Number.isFinite(transform.y) ? transform.y : 0),
      scale: Number(
        (Number.isFinite(transform.scale) ? Math.max(0.01, transform.scale) : 1).toFixed(3)
      )
    }),
    []
  );

  const getPreviewItem = useCallback((): Partial<PlaylistItem> => {
    // If no image yet, show a friendly fallback on the panel
    if (!imageDetails || !imageDetails.image_id) {
      return {
        border_effect: formData.border_effect,
        content: {
          type: ContentType.Text,
          data: {
            type: 'Text',
            text: 'Upload an image',
            scroll: false,
            color: [255, 255, 255],
            speed: 50
          }
        },
        duration: formData.duration || 10
      };
    }

    const previewItem: Partial<PlaylistItem> = {
      border_effect: formData.border_effect,
      content: {
        type: ContentType.Image,
        data: {
          type: 'Image',
          image_id: imageDetails.image_id,
          natural_width: imageDetails.natural_width,
          natural_height: imageDetails.natural_height,
          transform: previewTransform ? sanitizePreviewTransform(previewTransform) : { x: 0, y: 0, scale: 1 },
          animation: normalizedAnimation
        }
      }
    };

    if (hasAnimation) {
      previewItem.repeat_count = formData.repeat_count ?? normalizedAnimation?.iterations ?? 1;
    } else {
      previewItem.duration = formData.duration || 10;
    }

    return previewItem;
  }, [
    imageDetails,
    formData.border_effect,
    formData.duration,
    formData.repeat_count,
    hasAnimation,
    normalizedAnimation,
    previewTransform,
    sanitizePreviewTransform
  ]);

  const updatePreview = useCallback((previewItem: Partial<PlaylistItem>) => {
    if (PreviewState.isActive && PreviewState.sessionId) {
      updatePreviewContent(previewItem, PreviewState.sessionId).catch((err) => {
        console.error('Failed to update preview:', err);
      });
    }
  }, []);

  const debouncedUpdatePreview = useRef(
    debounce((previewItem: Partial<PlaylistItem>) => {
      if (PreviewState.isActive && PreviewState.sessionId) {
        updatePreviewContent(previewItem, PreviewState.sessionId).catch((err) => {
          console.error('Failed to update preview:', err);
        });
      }
    }, 80)
  ).current;

  const setupPreview = useCallback(async () => {
    if (PreviewState.isActive) {
      setPreviewActive(true);
      return { success: true };
    }

    if (PreviewState.isInitializing && PreviewState.initPromise) {
      return PreviewState.initPromise;
    }

    const previewItem = getPreviewItem();
    if (!previewItem) {
      return { success: false, error: 'Image not ready for preview' };
    }

    PreviewState.isInitializing = true;
    const promise = (async () => {
      try {
        const response = await startPreviewMode(previewItem);
        PreviewState.sessionId = response.session_id;
        PreviewState.isActive = true;
        PreviewState.startPinging();

        if (mountedRef.current) {
          setPreviewActive(true);
          setSessionExpired(false);
        }

        return { success: true };
      } catch (error) {
        if (error instanceof Error && error.message.includes('403')) {
          console.warn('Preview already active in another session');
          return { success: false, error: 'Preview already active in another session' };
        }
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error initializing preview'
        };
      } finally {
        PreviewState.isInitializing = false;
        PreviewState.initPromise = null;
      }
    })();

    PreviewState.initPromise = promise;
    return promise;
  }, [getPreviewItem]);

  const checkSessionValidity = useCallback(async () => {
    if (!PreviewState.sessionId || !PreviewState.isActive) return false;
    try {
      const result = await checkPreviewSessionOwnership(PreviewState.sessionId);
      return result.is_owner;
    } catch (error) {
      console.warn('Error checking session validity:', error);
      return false;
    }
  }, []);

  const handleVisibilityChange = useCallback(async () => {
    if (!PreviewState.isActive || !PreviewState.sessionId) return;

    if (document.visibilityState === 'visible' && PreviewState.tabWasHidden) {
      PreviewState.tabWasHidden = false;
      const isValid = await checkSessionValidity();

      if (!isValid) {
        PreviewState.cleanup();
        setPreviewActive(false);
        const editorResetEvent = new CustomEvent('editor-session-expired');
        document.dispatchEvent(editorResetEvent);
      } else {
        PreviewState.startPinging();
        const previewItem = getPreviewItem();
        if (previewItem) {
          updatePreview(previewItem);
        }
      }
    } else if (document.visibilityState === 'hidden') {
      PreviewState.tabWasHidden = true;
    }
  }, [checkSessionValidity, getPreviewItem, updatePreview]);

  const stopPreview = useCallback(() => {
    debouncedUpdatePreview.cancel();
    PreviewState.cleanup();
    setPreviewActive(false);
  }, [debouncedUpdatePreview]);

  const refreshPreview = useCallback(() => {
    if (!PreviewState.isActive || loading || !PreviewState.sessionId) return;
    const previewItem = getPreviewItem();
    if (previewItem) {
      updatePreview(previewItem);
    }
  }, [getPreviewItem, loading, updatePreview]);

  const debouncedRefreshPreview = useCallback(() => {
    if (!PreviewState.isActive || loading || !PreviewState.sessionId) return;
    const previewItem = getPreviewItem();
    if (previewItem) {
      debouncedUpdatePreview(previewItem);
    }
  }, [debouncedUpdatePreview, getPreviewItem, loading]);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  useEffect(() => {
    if (sessionExpired && !loading) {
      const timeout = setTimeout(() => {
        setupPreview().then((result) => {
          if (mountedRef.current && !result?.success && result?.error) {
            console.error('Preview re-initialization failed:', result.error);
          }
        });
      }, 200);

      return () => clearTimeout(timeout);
    }
  }, [sessionExpired, loading, setupPreview]);

  useEffect(() => {
    if (!PreviewState.isActive && !PreviewState.isInitializing) {
      setupPreview().then((result) => {
        if (mountedRef.current && !result?.success && result?.error) {
          console.error('Preview initialization failed:', result.error);
        }
      });
    } else if (PreviewState.isActive) {
      setPreviewActive(true);
      if (PreviewState.sessionId && !PreviewState.pingInterval) {
        PreviewState.startPinging();
      }
    }

    return () => {
      mountedRef.current = false;
      debouncedUpdatePreview.cancel();
    };
  }, [setupPreview, debouncedUpdatePreview]);

  useEffect(() => {
    if (!PreviewState.isActive || loading || !PreviewState.sessionId) return;
    const previewItem = getPreviewItem();
    if (previewItem) {
      debouncedUpdatePreview(previewItem);
      if (!PreviewState.pingInterval) {
        PreviewState.startPinging();
      }
    }
  }, [
    imageDetails?.image_id,
    imageDetails?.transform,
    imageDetails?.animation?.keyframes,
    imageDetails?.animation?.iterations,
    loading,
    getPreviewItem,
    debouncedUpdatePreview
  ]);

  useEffect(() => {
    if (!PreviewState.isActive || loading || !PreviewState.sessionId) return;
    refreshPreview();
  }, [
    formData.duration,
    formData.repeat_count,
    hasAnimation,
    loading,
    refreshPreview
  ]);

  return useMemo(
    () => ({
      previewActive,
      previewInitialized: PreviewState.isActive,
      stopPreview,
      refreshPreview,
      debouncedRefreshPreview,
      sessionId: PreviewState.sessionId,
      sessionExpired,
      // Restart remote animation from t=0 by resending the current preview item.
      // Ensures the panel animation restarts in sync with the local playhead.
      playFromStart: async () => {
        // Ensure we have a session; if not, try to create one
        if (!PreviewState.isActive || !PreviewState.sessionId) {
          const result = await setupPreview();
          if (!result?.success) {
            return;
          }
        }
        const previewItem = getPreviewItem();
        if (previewItem && PreviewState.sessionId) {
          try {
            await updatePreviewContent(previewItem, PreviewState.sessionId);
          } catch (err) {
            console.error('Failed to restart remote animation:', err);
          }
        }
      }
    }),
    [
      previewActive,
      stopPreview,
      refreshPreview,
      debouncedRefreshPreview,
      sessionExpired,
      getPreviewItem,
      setupPreview
    ]
  );
}

