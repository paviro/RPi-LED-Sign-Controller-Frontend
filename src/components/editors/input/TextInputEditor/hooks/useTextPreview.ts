import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import { 
  startPreviewMode, 
  exitPreviewMode, 
  pingPreviewMode 
} from '../../../../../lib/api';
import { PlaylistItem, ContentType, BorderEffect } from '../../../../../types';

/**
 * Options for the text preview hook
 */
interface TextPreviewOptions {
  formData: Partial<PlaylistItem>;
  selectedColor: [number, number, number];
  textSegments: Array<{
    start: number;
    end: number;
    color?: [number, number, number];
    formatting?: {
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
    };
  }>;
  getBorderEffectObject: () => BorderEffect;
  loading: boolean;
}

/**
 * Custom hook to manage preview functionality for text content
 */
export default function useTextPreview({
  formData,
  selectedColor,
  textSegments,
  getBorderEffectObject,
  loading
}: TextPreviewOptions) {
  // Preview state
  const [previewActive, setPreviewActive] = useState(false);
  const previewInitialized = useRef(false);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Creates a preview item from current form data
   */
  const getPreviewItem = useCallback((): Partial<PlaylistItem> => {
    // Determine if scrolling is enabled
    const isScrolling = formData.content?.data?.scroll || false;
    
    const previewItem: Partial<PlaylistItem> = {
      border_effect: getBorderEffectObject(),
      content: {
        type: ContentType.Text,
        data: {
          type: 'Text',
          text: formData.content?.data?.text || 'Edit Mode',
          scroll: isScrolling,
          color: selectedColor,
          speed: formData.content?.data?.speed || 50,
          text_segments: textSegments.length > 0 ? textSegments : undefined
        }
      }
    };
    
    // Add only the appropriate timing parameter based on scroll setting
    if (isScrolling) {
      previewItem.repeat_count = formData.repeat_count || 1;
    } else {
      previewItem.duration = formData.duration || 10;
    }
    
    return previewItem;
  }, [
    formData.duration,
    formData.repeat_count,
    formData.content?.data?.text,
    formData.content?.data?.scroll,
    formData.content?.data?.speed,
    selectedColor,
    getBorderEffectObject,
    textSegments
  ]);

  /**
   * Sends an immediate update (non-debounced)
   */
  const updatePreview = useCallback((previewItem: Partial<PlaylistItem>) => {
    if (previewInitialized.current) {
      startPreviewMode(previewItem);
    }
  }, []);

  /**
   * Sends a debounced update (for text changes) - 50ms
   */
  const debouncedUpdatePreview = useRef(
    debounce((previewItem: Partial<PlaylistItem>) => {
      if (previewInitialized.current) {
        startPreviewMode(previewItem);
      }
    }, 50)
  ).current;

  /**
   * Starts the ping interval to keep the preview session alive
   */
  const startPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    // Send a ping every 4 seconds
    pingIntervalRef.current = setInterval(() => {
      pingPreviewMode();
    }, 4000);
  }, []);

  /**
   * Initializes preview mode
   */
  const setupPreview = useCallback(async () => {
    try {
      const initialPreview = getPreviewItem();
      await startPreviewMode(initialPreview);
      previewInitialized.current = true;
      setPreviewActive(false);
      // Start keep-alive pings
      startPingInterval();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error initializing preview'
      };
    }
  }, [getPreviewItem, startPingInterval]);

  /**
   * Stops preview mode - only call this explicitly (e.g. "Back" button)
   */
  const stopPreview = useCallback(() => {
    // Cancel debounced updates
    debouncedUpdatePreview.cancel();

    // Stop pinging
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    // Actually exit preview mode if we were initialized
    if (previewInitialized.current) {
      exitPreviewMode();
      previewInitialized.current = false;
    }
    setPreviewActive(false);
  }, [debouncedUpdatePreview]);

  /**
   * Refresh the preview immediately (for checkboxes, speed sliders, etc.)
   */
  const refreshTextPreview = useCallback(() => {
    if (!previewInitialized.current || loading) return;
    updatePreview(getPreviewItem());
  }, [loading, updatePreview, getPreviewItem]);

  /**
   * Refresh the preview with debounce (for typed text changes)
   */
  const debouncedRefreshTextPreview = useCallback(() => {
    if (!previewInitialized.current || loading) return;
    debouncedUpdatePreview(getPreviewItem());
  }, [loading, getPreviewItem, debouncedUpdatePreview]);

  // Set up preview on mount, no auto-exit on unmount
  useEffect(() => {
    if (!previewInitialized.current) {
      setupPreview().then(result => {
        if (!result?.success && result?.error) {
          console.error('Preview initialization failed:', result.error);
        }
      });
    }

    // Cleanup on unmount: just cancel in-flight updates & stop pinging
    return () => {
      debouncedUpdatePreview.cancel();
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      // NOTICE: We do NOT call exitPreviewMode() here.
      // That ensures no DELETE request happens on re-renders or unmount.
    };
  }, [setupPreview, debouncedUpdatePreview]);

  // Watch for text changes → debounced updates
  useEffect(() => {
    if (!previewInitialized.current || loading) return;
    debouncedUpdatePreview(getPreviewItem());
  }, [
    formData.content?.data?.text,
    loading,
    getPreviewItem,
    debouncedUpdatePreview
  ]);

  // Watch for non-text changes → immediate updates
  useEffect(() => {
    if (!previewInitialized.current || loading) return;
    updatePreview(getPreviewItem());
  }, [
    // UI controls that need immediate refresh
    formData.content?.data?.scroll,
    formData.content?.data?.speed,
    formData.duration,
    formData.repeat_count,
    selectedColor,
    loading,
    updatePreview,
    getPreviewItem
  ]);

  return useMemo(() => ({
    previewActive,
    previewInitialized: previewInitialized.current,
    stopPreview,
    refreshTextPreview,
    debouncedRefreshTextPreview
  }), [
    previewActive,
    stopPreview,
    refreshTextPreview,
    debouncedRefreshTextPreview
  ]);
} 