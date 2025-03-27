import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import { 
  startPreviewMode, 
  updatePreviewContent,
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

// Global static state to track preview status across component instances
const PreviewState = {
  isActive: false,
  sessionId: null as string | null,
  isInitializing: false,
  initPromise: null as Promise<{success: boolean; error?: string}> | null,
  pingInterval: null as NodeJS.Timeout | null,
  
  // Global methods for managing the preview state
  startPinging: function() {
    // Clear any existing interval first
    this.stopPinging();
    
    // Send a ping every 4 seconds as long as we have a session ID
    this.pingInterval = setInterval(() => {
      if (this.sessionId) {
        pingPreviewMode(this.sessionId).catch(err => {
          console.warn('Ping failed:', err);
        });
      }
    }, 4000);
  },
  
  stopPinging: function() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  },
  
  // Clean up the entire preview state
  cleanup: function() {
    this.stopPinging();
    
    if (this.isActive && this.sessionId) {
      exitPreviewMode(this.sessionId).catch(e => 
        console.warn('Error exiting preview mode:', e)
      );
      
      this.sessionId = null;
      this.isActive = false;
    }
  }
};

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
  // Local state that syncs with global state
  const [previewActive, setPreviewActive] = useState(PreviewState.isActive);
  
  // Track if component is mounted
  const mountedRef = useRef(true);

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
    if (PreviewState.isActive && PreviewState.sessionId) {
      updatePreviewContent(previewItem, PreviewState.sessionId).catch(err => {
        console.error('Failed to update preview:', err);
      });
    }
  }, []);

  /**
   * Sends a debounced update (for text changes) - 50ms
   */
  const debouncedUpdatePreview = useRef(
    debounce((previewItem: Partial<PlaylistItem>) => {
      if (PreviewState.isActive && PreviewState.sessionId) {
        updatePreviewContent(previewItem, PreviewState.sessionId).catch(err => {
          console.error('Failed to update preview:', err);
        });
      }
    }, 50)
  ).current;

  /**
   * Initializes preview mode
   */
  const setupPreview = useCallback(async () => {
    // If already initialized, return success
    if (PreviewState.isActive) {
      // Make sure UI reflects the global state
      setPreviewActive(true);
      return { success: true };
    }
    
    // If there's an initialization in progress, return the existing promise
    if (PreviewState.isInitializing && PreviewState.initPromise) {
      return PreviewState.initPromise;
    }
    
    // Create a new initialization promise
    PreviewState.isInitializing = true;
    const promise = (async () => {
      try {
        const initialPreview = getPreviewItem();
        const response = await startPreviewMode(initialPreview);
        
        PreviewState.sessionId = response.session_id;
        PreviewState.isActive = true;
        PreviewState.startPinging();
        
        if (mountedRef.current) {
          setPreviewActive(true);
        }
        
        return { success: true };
      } catch (error) {
        if (error instanceof Error && error.message.includes('403')) {
          console.warn('Preview already active in another session');
          return { success: false, error: "Preview already active in another session" };
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
    
    // Store the promise so other calls can use it
    PreviewState.initPromise = promise;
    return promise;
  }, [getPreviewItem]);

  /**
   * Stops preview mode - only call this explicitly (e.g. "Back" button)
   */
  const stopPreview = useCallback(() => {
    // Cancel debounced updates
    debouncedUpdatePreview.cancel();

    // Clean up the global preview state
    PreviewState.cleanup();
    
    // Update local state
    setPreviewActive(false);
  }, [debouncedUpdatePreview]);

  /**
   * Refresh the preview immediately (for checkboxes, speed sliders, etc.)
   */
  const refreshTextPreview = useCallback(() => {
    if (!PreviewState.isActive || loading || !PreviewState.sessionId) return;
    updatePreview(getPreviewItem());
  }, [loading, updatePreview, getPreviewItem]);

  /**
   * Refresh the preview with debounce (for typed text changes)
   */
  const debouncedRefreshTextPreview = useCallback(() => {
    if (!PreviewState.isActive || loading || !PreviewState.sessionId) return;
    debouncedUpdatePreview(getPreviewItem());
  }, [loading, getPreviewItem, debouncedUpdatePreview]);

  // Set up preview on mount and ensure preview is active
  useEffect(() => {
    // Only initialize if we aren't already in preview mode
    if (!PreviewState.isActive && !PreviewState.isInitializing) {
      setupPreview().then(result => {
        if (mountedRef.current && !result?.success && result?.error) {
          console.error('Preview initialization failed:', result.error);
        }
      });
    } else if (PreviewState.isActive) {
      // Sync local state with global state
      setPreviewActive(true);
      
      // Ensure ping interval is running if preview is already initialized
      if (PreviewState.sessionId && !PreviewState.pingInterval) {
        PreviewState.startPinging();
      }
    }

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      debouncedUpdatePreview.cancel();
      
      // Note: We don't stop pinging or exit preview on component unmount
      // because other components might still be using the preview
      // PreviewState.cleanup() would be called explicitly via stopPreview()
    };
  }, [setupPreview, debouncedUpdatePreview]);
  
  // Watch for content changes and update preview as needed
  useEffect(() => {
    if (!PreviewState.isActive || loading || !PreviewState.sessionId) return;
    debouncedUpdatePreview(getPreviewItem());
    
    // Ensure ping interval is running
    if (!PreviewState.pingInterval) {
      PreviewState.startPinging();
    }
  }, [
    formData.content?.data?.text,
    loading,
    getPreviewItem,
    debouncedUpdatePreview
  ]);

  // Watch for essential property changes and update immediately
  useEffect(() => {
    if (!PreviewState.isActive || loading || !PreviewState.sessionId) return;
    updatePreview(getPreviewItem());
    
    // Ensure ping interval is running
    if (!PreviewState.pingInterval) {
      PreviewState.startPinging();
    }
  }, [
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
    previewInitialized: PreviewState.isActive,
    stopPreview,
    refreshTextPreview,
    debouncedRefreshTextPreview,
    sessionId: PreviewState.sessionId // expose session ID if needed externally
  }), [
    previewActive,
    stopPreview,
    refreshTextPreview,
    debouncedRefreshTextPreview,
    PreviewState.sessionId
  ]);
} 