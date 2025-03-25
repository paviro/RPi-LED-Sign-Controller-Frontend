'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import { useEffect, useState, useRef } from 'react';
import Toolbar from './components/EditorToolbar/Toolbar';
import { useRainbowEffects } from './hooks/useRainbowEffects';
import { useSegmentProcessing } from './hooks/useSegmentProcessing';
import { useEditorUtils } from './hooks/useEditorUtils';
import { useColorFormatting } from './hooks/useColorFormatting';
import { useFormatting } from './hooks/useFormatting';

/**
 * TextEditor component provides a rich text editor with color formatting capabilities
 * It displays text in a LED-style display with custom color controls
 */
interface TextEditorProps {
  initialValue: string;
  onChange: (text: string) => void;
  onSegmentsChange: (segments: Array<{start: number; end: number; color?: [number, number, number]; formatting?: {bold?: boolean; strikethrough?: boolean; underline?: boolean}}>) => void;
  selectedColor: [number, number, number];
  onColorChange?: (color: [number, number, number]) => void;
  textSegments?: Array<{start: number; end: number; color?: [number, number, number]; formatting?: {bold?: boolean; strikethrough?: boolean; underline?: boolean}}>;
}

// Styling for LED-style display and editor controls
const ledDisplayStyles = {
  editorWrapper: "border rounded-xl border-gray-200 dark:border-gray-700 shadow-md overflow-hidden transition-all",
  editorToolbar: "bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex gap-3 flex-wrap",
  editorContent: "p-5 min-h-[180px] bg-black text-white font-mono whitespace-pre-wrap outline-none rounded-b-xl",
  button: "px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300 transition-colors border border-gray-200 dark:border-gray-700",
  activeButton: "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
  colorSwatch: "w-5 h-5 rounded-md border border-gray-300 dark:border-gray-600 shadow-sm"
};

// Convert RGB array to hex color helper function
const rgbToHex = (rgb: [number, number, number]): string => {
  return '#' + rgb.map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

export default function TextEditor({ 
  initialValue, 
  onChange, 
  onSegmentsChange, 
  selectedColor,
  onColorChange,
  textSegments = [] 
}: TextEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  
  // Track editor focus state to prevent content updates during editing
  const isEditorFocused = useRef(false);
  
  // Store selection information for use between operations
  const lastSelectionRef = useRef<{ from: number; to: number } | null>(null);
  const hasSelectionRef = useRef(false);
  
  // Flag to prevent recursive color application
  const applyingColorRef = useRef(false);
  
  // Use segment processing hook
  const { processColorSegmentsWithSpaces } = useSegmentProcessing({
    onSegmentsChange
  });
  
  // Initialize Tiptap editor with required extensions and event handlers
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bold: {
          HTMLAttributes: {
            class: 'editor-bold',
          },
        },
        strike: {
          HTMLAttributes: {
            class: 'editor-strike',
          },
        },
        italic: false
      }),
      TextStyle,
      Color,
      Underline.configure({
        HTMLAttributes: {
          class: 'editor-underline',
        },
      }),
    ],
    content: initialValue,
    immediatelyRender: false,
    parseOptions: {
      preserveWhitespace: 'full',
    },
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      onChange(text);
      processColorSegmentsWithSpaces(editor.getHTML());

      // Update formatting states based on current selection
      updateFormattingStates(editor);
    },
    onSelectionUpdate: ({ editor }) => {
      // Update the formatting states when selection changes
      updateFormattingStates(editor);
    },
    onFocus: () => {
      isEditorFocused.current = true;
    },
    onBlur: () => {
      isEditorFocused.current = false;
    },
    onTransaction: ({ transaction }) => {
      // Only process if there's text being added (not on selection changes or deletions)
      if (transaction.docChanged && !applyingColorRef.current) {
        const hexColor = rgbToHex(selectedColor);
        
        // Set the color for any new typing - must be scheduled after the current transaction
        setTimeout(() => {
          if (editor) {
            // We only set color for the current cursor position, not selections
            const { from, to } = editor.state.selection;
            if (from === to) {
              editor.chain().setColor(hexColor).run();
            }
          }
        }, 0);
      }
    },
    editorProps: {
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter') {
          return true;
        }
        return false;
      },
    }
  });
  
  // Use editor utilities hook
  const { withPreservedSelection, generateHtmlFromSegments } = useEditorUtils({
    editor,
    rgbToHex,
    isEditorFocused,
    textSegments
  });
  
  // Use formatting hook
  const { 
    isBold, 
    isStrikethrough, 
    isUnderline, 
    updateFormattingStates, 
    toggleFormat 
  } = useFormatting({
    editor,
    withPreservedSelection
  });
  
  // Use color formatting hook
  const { applyColor } = useColorFormatting({
    editor,
    rgbToHex,
    onColorChange,
    withPreservedSelection,
    hasSelectionRef,
    lastSelectionRef,
    applyingColorRef
  });
  
  // Use rainbow effects hook
  const { applyRainbowEffect } = useRainbowEffects({
    editor,
    rgbToHex,
    textSegments,
    processColorSegmentsWithSpaces,
    withPreservedSelection
  });
  
  // Handle clicks outside the color picker to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Ignore clicks on the color picker button itself to avoid toggle conflicts
      const isColorPickerButton = (event.target as Element).closest('button[title="Text Color"]');
      if (!isColorPickerButton && colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    }
    
    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColorPicker]);

  /**
   * Sync editor content with external textSegments prop changes
   */
  useEffect(() => {
    if (!editor || !textSegments || textSegments.length === 0) return;
    
    // Generate HTML from segments
    const html = generateHtmlFromSegments();
    
    if (html) {
      // Only update if content is different to avoid unnecessary rerenders
      const currentHTML = editor.getHTML();
      if (currentHTML.replace(/\s+/g, '') !== html.replace(/\s+/g, '')) {
        editor.commands.setContent(html);
      }
    }
  }, [editor, textSegments, generateHtmlFromSegments]);
  
  return (
    <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
          <span className="p-1 bg-indigo-100 dark:bg-indigo-900/20 rounded mr-2 text-indigo-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
          </span>
          Message Text
        </h3>
        <div className={ledDisplayStyles.editorWrapper}>
          <Toolbar
            editor={editor}
            styles={{
              editorToolbar: ledDisplayStyles.editorToolbar,
              button: ledDisplayStyles.button,
              activeButton: ledDisplayStyles.activeButton,
              colorSwatch: ledDisplayStyles.colorSwatch
            }}
            selectedColor={selectedColor}
            isBold={isBold}
            isStrikethrough={isStrikethrough}
            isUnderline={isUnderline}
            toggleFormat={toggleFormat}
            applyColor={applyColor}
            applyRainbowEffect={applyRainbowEffect}
            showColorPicker={showColorPicker}
            setShowColorPicker={setShowColorPicker}
            colorPickerRef={colorPickerRef as React.RefObject<HTMLDivElement>}
            hasSelectionRef={hasSelectionRef}
            lastSelectionRef={lastSelectionRef}
            rgbToHex={rgbToHex}
          />
          
          <div 
            onClick={() => editor?.commands.focus()} 
            className={`${ledDisplayStyles.editorContent} [&_.ProseMirror]:outline-none [&_*:focus]:outline-none`}
          >
            {editor ? (
              <EditorContent editor={editor} />
            ) : (
              <div className="text-gray-500">Loading editor...</div>
            )}
          </div>
        </div>
    </div>
  );
} 