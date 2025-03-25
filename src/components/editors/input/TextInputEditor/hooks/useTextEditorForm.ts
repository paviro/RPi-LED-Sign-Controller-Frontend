import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  fetchPlaylistItem, 
  createPlaylistItem, 
  updatePlaylistItem
} from '../../../../../lib/api';
import { PlaylistItem, ContentType, TextSegment, RGBColor, BorderEffect } from '../../../../../types';

interface UseTextEditorFormProps {
  itemId: string | null;
  onSuccess: () => void;
}

export function useTextEditorForm({ itemId, onSuccess }: UseTextEditorFormProps) {
  // Initialize with default values
  const [form, setForm] = useState<Partial<PlaylistItem>>({
    duration: 10,
    repeat_count: 1,
    border_effect: { None: null },
    content: {
      type: ContentType.Text,
      data: {
        type: 'Text',
        text: '',
        scroll: false,
        color: [255, 255, 255],
        speed: 50,
        text_segments: []
      }
    }
  });
  
  // Loading and saving states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNewItem, setIsNewItem] = useState(true);
  const [status, setStatus] = useState<{ message: string; type: "error" | "success" | "info" } | null>(null);
  
  // Text color (separated from form for easier updates)
  const [textColor, setTextColor] = useState<RGBColor>([255, 255, 255]);
  
  // Track text segments with color formatting
  const [textSegments, setTextSegments] = useState<TextSegment[]>([]);
  
  // Use a ref to track if data has been loaded initially
  const initialDataLoadedRef = useRef(false);
  
  // Update text color in both state and form
  const updateTextColor = useCallback((color: RGBColor) => {
    if (
      textColor[0] !== color[0] ||
      textColor[1] !== color[1] ||
      textColor[2] !== color[2]
    ) {
      setTextColor(color);
      setForm(prev => ({
        ...prev,
        content: {
          ...prev.content!,
          data: {
            ...prev.content!.data,
            color
          }
        }
      }));
    }
  }, [textColor]);
  
  // Load item data when itemId changes - BUT ONLY ONCE
  useEffect(() => {
    const loadItem = async () => {
      // Skip if we've already loaded data for this item
      if (initialDataLoadedRef.current && itemId) {
        return;
      }
      
      setLoading(true);
      
      if (itemId) {
        try {
          const item = await fetchPlaylistItem(itemId);
          setForm(item);
          
          // Set the selected color from the item's content
          if (item.content?.data?.color) {
            updateTextColor(item.content.data.color);
          }
          
          // Load text segments if they exist
          if (item.content?.data?.text_segments && item.content.data.text_segments.length > 0) {
            setTextSegments(item.content.data.text_segments);
          }
          
          setIsNewItem(false);
          // Mark initial data as loaded
          initialDataLoadedRef.current = true;
        } catch (error) {
          setStatus({
            message: `Error loading item: ${error instanceof Error ? error.message : 'Unknown error'}`,
            type: 'error'
          });
        }
      }
      
      setLoading(false);
    };
    
    loadItem();
  }, [itemId]); // Without updateTextColor in the dependency array
  
  // Other update methods
  const updateText = useCallback((text: string) => {
    setForm(prev => ({
      ...prev,
      content: {
        ...prev.content!,
        data: {
          ...prev.content!.data,
          text
        }
      }
    }));
  }, []);
  
  const updateScroll = useCallback((scroll: boolean) => {
    setForm(prev => ({
      ...prev,
      content: {
        ...prev.content!,
        data: {
          ...prev.content!.data,
          scroll
        }
      }
    }));
  }, []);
  
  const updateScrollSpeed = useCallback((speed: number) => {
    setForm(prev => ({
      ...prev,
      content: {
        ...prev.content!,
        data: {
          ...prev.content!.data,
          speed
        }
      }
    }));
  }, []);
  
  const updateDuration = useCallback((duration: number) => {
    setForm(prev => ({ ...prev, duration }));
  }, []);
  
  const updateRepeatCount = useCallback((repeat_count: number) => {
    setForm(prev => ({ ...prev, repeat_count }));
  }, []);

  // Save the item
  const saveItem = useCallback(async (borderEffect: BorderEffect) => {
    if (!form.content?.data?.text || form.content.data.text.trim() === '') {
      setStatus({ message: 'Please enter message text', type: 'error' });
      return;
    }
    
    setSaving(true);
    
    try {
      // Create item data
      const itemToSave: Partial<PlaylistItem> = {
        duration: form.duration || 10,
        repeat_count: form.repeat_count || 1,
        border_effect: borderEffect,
        content: {
          type: ContentType.Text,
          data: {
            type: 'Text',
            text: form.content?.data?.text || '',
            scroll: form.content?.data?.scroll || false,
            color: textColor,
            speed: form.content?.data?.speed || 50,
            text_segments: textSegments.length > 0 ? textSegments : undefined
          }
        }
      };
      
      if (isNewItem) {
        await createPlaylistItem(itemToSave);
      } else if (itemId) {
        await updatePlaylistItem(itemId, {
          ...itemToSave,
          id: itemId
        });
      }
      
      onSuccess();
    } catch (error) {
      setStatus({
        message: `Error saving item: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  }, [form, textColor, textSegments, isNewItem, itemId, onSuccess]);
  
  return {
    form,
    setForm,
    textColor,
    updateText,
    updateScroll,
    updateScrollSpeed,
    updateDuration,
    updateRepeatCount,
    updateTextColor,
    textSegments,
    setTextSegments,
    loading,
    saving,
    status,
    setStatus,
    isNewItem,
    saveItem
  };
} 