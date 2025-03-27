'use client';

import { useState, useCallback, useEffect } from 'react';
import TextInputEditor from './input/TextInputEditor/TextInputEditor';
import ImageInputEditor from './input/ImageInputEditor/ImageInputEditor';
import EditorShell from './common/EditorShell';
import EditorUnavailable from './EditorUnavailable';
import { fetchPlaylistItem, checkPreviewStatus, subscribeToEditorLockEvents } from '../../lib/api';
import { ContentType } from '../../types';

interface EditorFactoryProps {
  itemId: string | null;
  onBack: () => void;
  initialContentType?: ContentType;
  registerExitPreview?: (exitFn: () => void) => void;
}

/**
 * EditorFactory determines which specialized editor to render
 * based on the content type of the playlist item.
 */
export default function EditorFactory({ 
  itemId, 
  onBack, 
  initialContentType = ContentType.Text,
  registerExitPreview 
}: EditorFactoryProps) {
  const [contentType, setContentType] = useState(initialContentType);
  const [status, setStatus] = useState<{ message: string; type: "error" | "success" | "info" } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [, setIsLoading] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Preview lock states
  const [previewActive, setPreviewActive] = useState(false);
  const [isCheckingPreview, setIsCheckingPreview] = useState(true);
  
  // Check if preview is active before loading editor
  useEffect(() => {
    const fetchPreviewStatus = async () => {
      setIsCheckingPreview(true);
      try {
        const response = await checkPreviewStatus();
        setPreviewActive(response.active);
      } catch (error) {
        console.error('Error checking preview status:', error);
        setStatus({
          message: 'Error checking if another user is editing. Try refreshing the page.',
          type: 'error'
        });
      } finally {
        setIsCheckingPreview(false);
      }
    };
    
    fetchPreviewStatus();
  }, []);
  
  // Update the editor lock events effect
  useEffect(() => {
    if (!previewActive) return;
    
    // Track whether the component is mounted to avoid state updates after unmount
    let isMounted = true;
    
    // Subscribe to editor lock events using the API function
    const cleanup = subscribeToEditorLockEvents(
      (data) => {
        if (!isMounted) return;
        
        if (!data.locked) {
          // Preview is no longer active, we can load the editor
          setPreviewActive(false);
          // Reset initial load to refetch the item
          setInitialLoadComplete(false);
        }
      },
      (error) => {
        if (!isMounted) return;
        console.error('Editor lock event stream error:', error);
      }
    );
    
    // Cleanup function to run on effect cleanup
    return () => {
      isMounted = false;
      cleanup();
    };
  }, [previewActive]);
  
  // Effect for handling the custom session expiration event - MOVED HERE
  useEffect(() => {
    const handleSessionExpired = () => {
      // Force a re-initialization of the preview check
      setInitialLoadComplete(false);
      setIsCheckingPreview(true);
      
      // Fetch preview status again
      const fetchPreviewStatus = async () => {
        try {
          const response = await checkPreviewStatus();
          setPreviewActive(response.active);
        } catch (error) {
          console.error('Error checking preview status after session expiration:', error);
        } finally {
          setIsCheckingPreview(false);
        }
      };
      
      fetchPreviewStatus();
    };
    
    // Listen for the custom event
    document.addEventListener('editor-session-expired', handleSessionExpired);
    
    return () => {
      document.removeEventListener('editor-session-expired', handleSessionExpired);
    };
  }, []);
  
  // Load content type from existing item if we're editing
  useEffect(() => {
    if (itemId && !initialLoadComplete && !previewActive) {
      fetchPlaylistItem(itemId)
        .then(item => {
          if (item && item.content && item.content.type) {
            setContentType(item.content.type);
          }
        })
        .catch(error => {
          console.error("Failed to load item type:", error);
          setStatus({
            message: "Error loading item. Using default content type.",
            type: "error"
          });
        })
        .finally(() => {
          setInitialLoadComplete(true);
        });
    } else if (!itemId) {
      setInitialLoadComplete(true);
    }
  }, [itemId, initialLoadComplete, previewActive]);
  
  // Function to handle content type changes (only for new items)
  const handleContentTypeChange = (newType: ContentType) => {
    if (!itemId) { // Only allow changing type for new items
      setContentType(newType);
    }
  };
  
  // Handle status close
  const handleStatusClose = () => {
    setStatus(null);
  };
  
  // Handle save action
  const handleSave = useCallback(() => {
    // Trigger save in the active editor
    const event = new CustomEvent('editor-save');
    document.dispatchEvent(event);
  }, []);
  
  // Register exit preview function for text editor
  const handleRegisterExitPreview = useCallback((exitFn: () => void) => {
    if (registerExitPreview) {
      registerExitPreview(exitFn);
    }
  }, [registerExitPreview]);
  
  // Map content types to their display titles
  const contentTypeDisplayTitles: Record<ContentType, string> = {
    [ContentType.Text]: 'Text Message',
    [ContentType.Image]: 'Image',
    [ContentType.Animation]: 'Animation',
    [ContentType.Clock]: 'Clock'
  };

  // Get the appropriate title for the current content type
  const getTitle = () => {
    return contentTypeDisplayTitles[contentType] || 'Content';
  };
  
  // Show loading indicator while checking preview status
  if (isCheckingPreview) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  // Show message if preview is active (another user is editing)
  if (previewActive) {
    return <EditorUnavailable onBack={onBack} />;
  }
  
  // Only show content after initial type is determined
  if (!initialLoadComplete) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  return (
    <EditorShell
      title={getTitle()}
      isNewItem={!itemId}
      onBack={onBack}
      contentType={contentType}
      onContentTypeChange={handleContentTypeChange}
      status={status}
      onStatusClose={handleStatusClose}
      isSaving={isSaving}
      onSave={handleSave}
    >
      {contentType === ContentType.Text ? (
        <TextInputEditor 
          itemId={itemId}
          updateStatus={setStatus}
          updateSaving={setIsSaving}
          updateLoading={setIsLoading}
          onBack={onBack}
          registerExitPreview={handleRegisterExitPreview}
        />
      ) : contentType === ContentType.Image ? (
        <ImageInputEditor 
          itemId={itemId}
          updateStatus={setStatus}
          updateSaving={setIsSaving}
          updateLoading={setIsLoading}
          onBack={onBack}
        />
      ) : null}
    </EditorShell>
  );
} 