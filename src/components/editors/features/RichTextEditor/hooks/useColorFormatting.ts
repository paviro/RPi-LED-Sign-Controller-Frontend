import { useCallback } from 'react';
import { Editor } from '@tiptap/react';

interface UseColorFormattingProps {
  editor: Editor | null;
  rgbToHex: (rgb: [number, number, number]) => string;
  onColorChange?: (color: [number, number, number]) => void;
  withPreservedSelection: (operation: () => void) => void;
  hasSelectionRef: { current: boolean };
  lastSelectionRef: { current: { from: number; to: number } | null };
  applyingColorRef: { current: boolean };
}

export const useColorFormatting = ({
  editor,
  rgbToHex,
  onColorChange,
  withPreservedSelection,
  hasSelectionRef,
  lastSelectionRef,
  applyingColorRef
}: UseColorFormattingProps) => {
  /**
   * Apply color to selected text while preserving selection and formatting
   */
  const applyColor = useCallback((color: [number, number, number]) => {
    if (!editor) return;
    
    // Prevent multiple rapid updates
    if (applyingColorRef.current) return;
    applyingColorRef.current = true;
    
    if (onColorChange) {
      onColorChange(color);
    }
    
    // Resolve selection
    let from: number, to: number;
    if (hasSelectionRef.current && lastSelectionRef.current) {
      from = lastSelectionRef.current.from;
      to = lastSelectionRef.current.to;
    } else {
      const selection = editor.state.selection;
      from = selection.from;
      to = selection.to;
    }
    
    if (from === to) {
      applyingColorRef.current = false;
      return;
    }
    
    withPreservedSelection(() => {
      const hexColor = rgbToHex(color);
      
      editor.commands.focus();
      editor.commands.setTextSelection({ from, to });
      
      // Apply color formatting
      if (hexColor === "#ffffff") {
        editor.chain().focus().unsetColor().run();
      } else {
        editor.chain().focus().setColor(hexColor).run();
      }
    });
    
    // Reset flag after a short delay
    setTimeout(() => {
      applyingColorRef.current = false;
    }, 50);
  }, [editor, onColorChange, withPreservedSelection, hasSelectionRef, lastSelectionRef, applyingColorRef, rgbToHex]);

  return { applyColor };
}; 