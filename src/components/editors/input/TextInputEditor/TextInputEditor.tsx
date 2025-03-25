'use client';

import { useCallback } from 'react';
import TextEditor from '../../features/RichTextEditor/RichTextEditor';
import ScrollControls from '../../features/ScrollControls/ScrollControls';
import BorderEffectSelector from '../../features/BorderEffectSelector/BorderEffectSelector';
import EditorLayout from '../../common/EditorLayout';
import useTextPreview from './hooks/useTextPreview';
import { useTextEditorForm } from './hooks/useTextEditorForm';
import { useBorderEffects } from '../../features/BorderEffectSelector/hooks/useBorderEffects';

interface TextInputEditorProps {
  itemId: string | null;
  onBack: () => void;
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
export default function TextInputEditor({ itemId, onBack }: TextInputEditorProps) {
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
    onSuccess: onBack 
  });
  
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
  
  // Use our specialized text preview hook - no need to call refresh methods
  const preview = useTextPreview({
    formData: form,
    selectedColor: textColor,
    textSegments,
    getBorderEffectObject,
    loading
  });
  
  // Handle navigation back to playlist view
  const handleBack = useCallback(() => {
    preview.stopPreview();
    onBack();
  }, [preview, onBack]);
  
  // Handle border effect selection
  const handleBorderEffectChange = useCallback((effect: string) => {
    setBorderEffectType(effect);
    
    // Refresh preview with new effect
    if (preview.previewActive && !loading) {
      preview.refreshTextPreview();
    }
  }, [setBorderEffectType, preview, loading]);
  
  // Save the item
  const handleSave = useCallback(async () => {
    const borderEffect = getBorderEffectObject();
    await saveItem(borderEffect);
    preview.stopPreview();
  }, [getBorderEffectObject, saveItem, preview]);

  // No need for useEffect calls to manually refresh the preview - it's handled internally

  return (
    <EditorLayout
      title="Text Message"
      isNewItem={isNewItem}
      onBack={handleBack}
      onSave={handleSave}
      isLoading={loading}
      isSaving={saving}
      status={status}
      onStatusClose={() => setStatus(null)}
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
    </EditorLayout>
  );
} 