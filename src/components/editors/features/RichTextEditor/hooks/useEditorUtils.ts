import { useCallback, RefObject } from 'react';
import { Editor } from '@tiptap/react';

interface UseEditorUtilsProps {
  editor: Editor | null;
  rgbToHex: (rgb: [number, number, number]) => string;
  isEditorFocused: RefObject<boolean>;
  textSegments: Array<{
    start: number; 
    end: number; 
    color?: [number, number, number]; 
    formatting?: {
      bold?: boolean; 
      strikethrough?: boolean; 
      underline?: boolean
    }
  }>;
}

export const useEditorUtils = ({ 
  editor, 
  rgbToHex,
  isEditorFocused,
  textSegments
}: UseEditorUtilsProps) => {
  /**
   * Helper function to preserve and restore text selection
   */
  const withPreservedSelection = useCallback((operation: () => void) => {
    if (!editor) return;
    
    // Store current selection
    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;
    
    // Save for later use if needed (not using refs here, but could be passed in)
    const selectionData = hasSelection ? { from, to } : null;
    
    // Perform the operation
    operation();
    
    // Restore selection after the editor updates
    if (hasSelection) {
      setTimeout(() => {
        if (editor) {
          editor.commands.setTextSelection({ from, to });
        }
      }, 10);
    }
    
    return selectionData;
  }, [editor]);

  /**
   * Generates HTML from text segments 
   */
  const generateHtmlFromSegments = useCallback(() => {
    if (!editor) return null;
    
    // Don't update the editor while it has focus to prevent disrupting user input
    if (isEditorFocused.current) return null;
    
    // Get the full text from the editor
    const fullText = editor.getText();
    
    // Convert segments to HTML
    const sortedSegments = [...textSegments].sort((a, b) => a.start - b.start);
    let html = '';
    let lastEnd = 0;
    
    sortedSegments.forEach(segment => {
      // Add any text between the last segment and this one
      if (segment.start > lastEnd && lastEnd < fullText.length) {
        const inBetweenText = fullText.substring(lastEnd, segment.start);
        html += inBetweenText;
      }
      
      // Extract text for this segment from the main text
      const segmentText = fullText.substring(segment.start, segment.end);
      
      // Start with basic span
      let spanStart = '<span';
      
      // Add color if specified
      if (segment.color) {
        const hexColor = rgbToHex(segment.color);
        spanStart += ` style="color: ${hexColor};"`;
      }
      
      // Close the opening tag
      spanStart += '>';
      
      // Add formatting if specified
      let formattedText = segmentText;
      if (segment.formatting) {
        if (segment.formatting.bold) {
          formattedText = `<strong>${formattedText}</strong>`;
        }
        if (segment.formatting.strikethrough) {
          formattedText = `<s>${formattedText}</s>`;
        }
        if (segment.formatting.underline) {
          formattedText = `<u>${formattedText}</u>`;
        }
      }
      
      html += `${spanStart}${formattedText}</span>`;
      lastEnd = segment.end;
    });
    
    // Add any trailing text after the last segment
    if (lastEnd < fullText.length) {
      html += fullText.substring(lastEnd);
    }
    
    return html;
  }, [editor, textSegments, rgbToHex, isEditorFocused]);

  return { 
    withPreservedSelection,
    generateHtmlFromSegments
  };
}; 