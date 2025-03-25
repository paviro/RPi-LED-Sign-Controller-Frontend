'use client';

import { useState, useCallback, useEffect } from 'react';
import TextInputEditor from './input/TextInputEditor/TextInputEditor';
import ImageInputEditor from './input/ImageInputEditor/ImageInputEditor';
import EditorShell from './common/EditorShell';
import { fetchPlaylistItem } from '../../lib/api';
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Load content type from existing item if we're editing
  useEffect(() => {
    if (itemId && !initialLoadComplete) {
      setIsLoading(true);
      // This is just a placeholder for how you might fetch the content type
      // You'll need to implement this based on your actual API
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
          setIsLoading(false);
          setInitialLoadComplete(true);
        });
    } else if (!itemId) {
      setInitialLoadComplete(true);
    }
  }, [itemId, initialLoadComplete]);
  
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