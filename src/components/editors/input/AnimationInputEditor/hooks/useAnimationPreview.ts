'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import {
  startPreviewMode,
  updatePreviewContent,
  checkPreviewSessionOwnership
} from '../../../../../lib/api';
import {
  AnimationContentDetails,
  BorderEffect,
  ContentType,
  PlaylistItem
} from '../../../../../types';
import PreviewState from '../../../common/previewState';

interface AnimationPreviewOptions {
  formData: Partial<PlaylistItem>;
  animationContent: AnimationContentDetails;
  borderEffect: BorderEffect | null;
  loading: boolean;
}

export default function useAnimationPreview({
  formData,
  animationContent,
  borderEffect,
  loading
}: AnimationPreviewOptions) {
  const [previewActive, setPreviewActive] = useState(PreviewState.isActive);
  const [sessionExpired, setSessionExpired] = useState(false);
  const mountedRef = useRef(true);

  const getPreviewItem = useCallback((): Partial<PlaylistItem> => {
    if (!animationContent.colors || animationContent.colors.length === 0) {
      return {
        border_effect: borderEffect ?? null,
        duration: formData.duration || 10,
        content: {
          type: ContentType.Text,
          data: {
            type: 'Text',
            text: 'Configure animation colors',
            scroll: false,
            color: [255, 255, 255],
            speed: 30
          }
        }
      };
    }

    return {
      border_effect: borderEffect ?? null,
      duration: formData.duration || 10,
      content: {
        type: ContentType.Animation,
        data: animationContent
      }
    };
  }, [animationContent, borderEffect, formData.duration]);

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
        updatePreview(getPreviewItem());
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
    updatePreview(getPreviewItem());
  }, [getPreviewItem, loading, updatePreview]);

  const debouncedRefreshPreview = useCallback(() => {
    if (!PreviewState.isActive || loading || !PreviewState.sessionId) return;
    debouncedUpdatePreview(getPreviewItem());
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
    debouncedUpdatePreview(getPreviewItem());
    if (!PreviewState.pingInterval) {
      PreviewState.startPinging();
    }
  }, [animationContent, borderEffect, loading, getPreviewItem, debouncedUpdatePreview]);

  useEffect(() => {
    if (!PreviewState.isActive || loading || !PreviewState.sessionId) return;
    refreshPreview();
  }, [formData.duration, loading, refreshPreview]);

  return useMemo(
    () => ({
      previewActive,
      previewInitialized: PreviewState.isActive,
      stopPreview,
      refreshPreview,
      debouncedRefreshPreview,
      sessionId: PreviewState.sessionId,
      sessionExpired,
      playFromStart: async () => {
        if (!PreviewState.isActive || !PreviewState.sessionId) {
          const result = await setupPreview();
          if (!result?.success) {
            return;
          }
        }
        const previewItem = getPreviewItem();
        if (PreviewState.sessionId) {
          try {
            await updatePreviewContent(previewItem, PreviewState.sessionId);
          } catch (err) {
            console.error('Failed to restart animation preview:', err);
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

