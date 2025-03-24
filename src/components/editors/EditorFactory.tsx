'use client';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useState, useEffect } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { PlaylistItem, ContentType } from '../../types';
import TextInputEditor from './input/TextInputEditor';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { fetchPlaylistItem } from '../../lib/api';

interface EditorFactoryProps {
  itemId: string | null;
  onBack: () => void;
}

/**
 * EditorFactory determines which specialized editor to render
 * based on the content type of the playlist item.
 */
export default function EditorFactory({ itemId, onBack }: EditorFactoryProps) {
  // For now, we'll directly route to the TextInputEditor
  // In the future, this will inspect the content type and route accordingly
  
  return (
    <TextInputEditor 
      itemId={itemId} 
      onBack={onBack} 
    />
  );
  
  /* Future implementation when we add more content types:
  
  const [loading, setLoading] = useState(true);
  const [itemType, setItemType] = useState<ContentType | null>(null);
  
  useEffect(() => {
    async function loadItemType() {
      if (itemId) {
        try {
          const item = await fetchPlaylistItem(itemId);
          setItemType(item.content.type);
        } catch (error) {
          console.error("Failed to load item type:", error);
          // Default to text editor on error
          setItemType(ContentType.Text);
        }
      } else {
        // New item defaults to text type
        setItemType(ContentType.Text);
      }
      setLoading(false);
    }
    
    loadItemType();
  }, [itemId]);
  
  if (loading) {
    return <div className="text-center py-12">Loading editor...</div>;
  }
  
  // Route to the appropriate editor based on content type
  switch (itemType) {
    case ContentType.Text:
      return <TextInputEditor itemId={itemId} onBack={onBack} />;
    case ContentType.Image:
      return <ImageInputEditor itemId={itemId} onBack={onBack} />;
    default:
      return <div className="text-center py-12">Unsupported content type</div>;
  }
  */
} 