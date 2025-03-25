import { useCallback, useState } from 'react';
import { Editor } from '@tiptap/react';

interface UseFormattingProps {
  editor: Editor | null;
  withPreservedSelection: (operation: () => void) => void;
}

export const useFormatting = ({
  editor,
  withPreservedSelection
}: UseFormattingProps) => {
  // Track formatting states
  const [isBold, setIsBold] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  /**
   * Helper function to update formatting button states
   */
  const updateFormattingStates = useCallback((editor: Editor) => {
    if (!editor) return;
    
    setIsBold(editor.isActive('bold'));
    setIsStrikethrough(editor.isActive('strike'));
    setIsUnderline(editor.isActive('underline'));
  }, []);

  /**
   * Apply formatting to selected text while preserving selection and other formatting
   */
  const toggleFormat = useCallback((format: 'bold' | 'strike' | 'underline') => {
    if (!editor) return;
    
    withPreservedSelection(() => {
      // Check if mark is active and apply the appropriate action
      const isActive = editor.isActive(format);
      
      if (isActive) {
        editor.chain().focus().unsetMark(format).run();
      } else {
        editor.chain().focus().setMark(format).run();
      }
      
      // Update UI state based on the new state
      switch (format) {
        case 'bold':
          setIsBold(editor.isActive('bold'));
          break;
        case 'strike':
          setIsStrikethrough(editor.isActive('strike'));
          break;
        case 'underline':
          setIsUnderline(editor.isActive('underline'));
          break;
      }
    });
  }, [editor, withPreservedSelection]);

  return {
    isBold,
    isStrikethrough,
    isUnderline,
    updateFormattingStates,
    toggleFormat
  };
}; 