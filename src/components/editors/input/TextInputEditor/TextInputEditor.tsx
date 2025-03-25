'use client';

import { useCallback, useState, useEffect } from 'react';
import TextEditor from '../../features/RichTextEditor/RichTextEditor';
import ScrollControls from '../../features/ScrollControls/ScrollControls';
import BorderEffectSelector from '../../features/BorderEffectSelector/BorderEffectSelector';
import useTextPreview from './hooks/useTextPreview';
import { useTextEditorForm } from './hooks/useTextEditorForm';
import { useBorderEffects } from '../../features/BorderEffectSelector/hooks/useBorderEffects';

interface TextInputEditorProps {
  itemId: string | null;
  updateStatus: (status: { message: string; type: "error" | "success" | "info" } | null) => void;
  updateSaving: (saving: boolean) => void;
  updateLoading: (loading: boolean) => void;
  onBack?: () => void;
  registerExitPreview?: (exitFn: () => void) => void;
}

/**
 * TextInputEditor allows editing text content for LED display
 * 
 * Features:
 * - Rich text editing with formatting options
 * - Text scrolling controls
 * - Border effects selection
 * - Live preview
 */
export default function TextInputEditor({ 
  itemId,
  updateStatus,
  updateSaving,
  updateLoading,
  onBack,
  registerExitPreview
}: TextInputEditorProps) {
  // Create a wrapper function that ensures onBack is always provided
  const handleSuccess = useCallback(() => {
    if (onBack) {
      onBack();
    }
  }, [onBack]);

  // Track when the form data is fully loaded
  const [isFormLoaded, setIsFormLoaded] = useState(false);
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);
  const [visible, setVisible] = useState(false);

  // Use our enhanced text editor form hook
  const {
    form,
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
  } = useTextEditorForm({ 
    itemId, 
    onSuccess: handleSuccess
  });
  
  // When form data changes, mark the form as loaded if it contains data
  useEffect(() => {
    if (form && !loading) {
      // Mark as loaded when we have form data and we're not loading
      setIsFormLoaded(true);
      
      // Fade in the editor
      setTimeout(() => {
        setVisible(true);
      }, 50);
    }
  }, [form, loading]);

  // Show loading indicator only if loading takes longer than expected
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (loading) {
      // Only show loading indicator if loading takes more than 500ms
      timeoutId = setTimeout(() => {
        setShowLoadingIndicator(true);
      }, 500);
    } else {
      setShowLoadingIndicator(false);
    }
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [loading]);

  // Update parent component loading state
  useEffect(() => {
    updateLoading(loading);
  }, [loading, updateLoading]);

  // Update parent status if we have one
  useEffect(() => {
    if (status) {
      updateStatus(status);
    }
  }, [status, updateStatus]);

  // Update parent saving state
  useEffect(() => {
    updateSaving(saving);
  }, [saving, updateSaving]);
  
  // Use border effects hook
  const {
    borderEffectType,
    setBorderEffectType,
    gradientColors,
    handleAddGradientColor,
    handleRemoveGradientColor,
    handleGradientColorEdit,
    getBorderEffectObject
  } = useBorderEffects(form.border_effect || undefined);
  
  // Use our specialized text preview hook
  const preview = useTextPreview({
    formData: form,
    selectedColor: textColor,
    textSegments,
    getBorderEffectObject,
    loading
  });
  
  // Handle border effect selection
  const handleBorderEffectChange = useCallback((effect: string) => {
    setBorderEffectType(effect);
    
    // Refresh preview with new effect
    if (preview.previewActive && !loading) {
      preview.refreshTextPreview();
    }
  }, [setBorderEffectType, preview, loading]);
  
  // Listen for save event from parent
  useEffect(() => {
    const handleSave = async () => {
      const borderEffect = getBorderEffectObject();
      await saveItem(borderEffect);
      preview.stopPreview();
    };

    document.addEventListener('editor-save', handleSave);
    return () => {
      document.removeEventListener('editor-save', handleSave);
    };
  }, [getBorderEffectObject, saveItem, preview]);

  // Register the stopPreview function so it can be called from parent
  useEffect(() => {
    if (registerExitPreview && preview.stopPreview) {
      registerExitPreview(preview.stopPreview);
    }
  }, [registerExitPreview, preview.stopPreview]);

  // If we're still loading the form data and the indicator should be shown
  if ((loading || !isFormLoaded) && showLoadingIndicator) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-2"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading editor content...</p>
        </div>
      </div>
    );
  }

  // If we're still loading but not showing the indicator yet, render an empty space
  if (loading || !isFormLoaded) {
    return <div className="h-40"></div>;
  }

  // Using a key to force re-render when form data changes
  return (
    <div 
      className={`space-y-6 transition-opacity duration-300 ease-in-out ${visible ? 'opacity-100' : 'opacity-0'}`} 
      key={`editor-${form.id || 'new'}`}
    >
      <TextEditor 
        initialValue={form.content?.data?.text || ''}
        onChange={updateText}
        onSegmentsChange={setTextSegments}
        selectedColor={textColor}
        onColorChange={updateTextColor}
        textSegments={textSegments}
      />
        
      <ScrollControls 
        isScrollEnabled={!!form.content?.data?.scroll}
        onScrollChange={updateScroll}
        scrollSpeed={form.content?.data?.speed || 50}
        onSpeedChange={updateScrollSpeed}
        duration={form.duration || 10}
        onDurationChange={updateDuration}
        repeatCount={form.repeat_count || 1}
        onRepeatCountChange={updateRepeatCount}
      />
  
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