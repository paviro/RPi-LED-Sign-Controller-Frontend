'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { useEffect, useCallback, useState, useRef } from 'react';
import ColorPicker from './ColorPicker';

/**
 * TextEditor component provides a rich text editor with color formatting capabilities
 * It displays text in a LED-style display with custom color controls
 */
interface TextEditorProps {
  initialValue: string;
  onChange: (text: string) => void;
  onSegmentsChange: (segments: Array<{start: number; end: number; text: string; color: [number, number, number]}>) => void;
  selectedColor: [number, number, number];
  onColorChange?: (color: [number, number, number]) => void;
  coloredSegments?: Array<{start: number; end: number; text: string; color: [number, number, number]}>;
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
  coloredSegments = [] 
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

  // Initialize Tiptap editor with required extensions and event handlers
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color
    ],
    content: initialValue,
    parseOptions: {
      preserveWhitespace: 'full',
    },
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      onChange(text);
      processColorSegmentsWithSpaces(editor.getHTML());
    },
    onFocus: () => {
      isEditorFocused.current = true;
    },
    onBlur: () => {
      isEditorFocused.current = false;
    },
    // Apply color to new text as it's being typed
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

  /**
   * Process HTML content to extract color segments for LED display
   * Parses DOM nodes from editor HTML to identify colored text segments
   */
  const processColorSegmentsWithSpaces = useCallback((html: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const segments: Array<{start: number; end: number; text: string; color: [number, number, number]}> = [];
    let currentIndex = 0;
    
    // Process DOM nodes recursively to extract text and color information
    const processNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent !== null) {
        let color: [number, number, number] = [255, 255, 255]; // Default white
        
        // Get color from inline style
        if (node.parentElement?.style.color) {
          const colorStr = node.parentElement.style.color;
          const rgbMatch = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
          
          if (rgbMatch) {
            color = [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])];
          }
        }
        
        const text = node.textContent;
        const start = currentIndex;
        const end = currentIndex + text.length;
        
        segments.push({
          start,
          end,
          text,
          color
        });
        
        currentIndex = end;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Process child nodes
        node.childNodes.forEach(child => processNode(child));
      }
    };
    
    // Process all root nodes
    tempDiv.childNodes.forEach(node => processNode(node));
    
    onSegmentsChange(segments);
  }, [onSegmentsChange]);
  
  /**
   * Apply selected color to the currently selected text
   * Uses Tiptap's setColor/unsetColor commands
   */
  const applyColor = useCallback((color: [number, number, number]) => {
    if (!editor) return;

    // Prevent multiple rapid updates
    if (applyingColorRef.current) return;
    applyingColorRef.current = true;

    if (onColorChange) {
      onColorChange(color);
    }

    // Use saved selection if available
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

    const hexColor = rgbToHex(color);

    editor.commands.focus();
    editor.commands.setTextSelection({ from, to });

    if (hexColor === "#ffffff") {
      // unsetColor to revert to default
      editor.chain().focus().setColor('#ffffff').unsetColor().run();
    } else {
      // Use Tiptap's setColor for partial selection
      editor.chain().focus().setColor(hexColor).run();
    }
    
    // Reset flag after a short delay
    setTimeout(() => {
      applyingColorRef.current = false;
    }, 50);
  }, [editor, onColorChange]);
  
  /**
   * Apply rainbow gradient effect to selected text character by character
   * Creates a smooth transition across all rainbow colors
   */
  const applyRainbowText = useCallback(() => {
    if (!editor) return;
    
    const { from, to } = editor.state.selection;
    if (from === to) {
      alert('Please select some text first');
      return;
    }
    
    const selectedText = editor.state.doc.textBetween(from, to);
    // Define colors for rainbow gradient
    const rainbowColors = [
      [255, 0, 0],    // Red
      [255, 165, 0],  // Orange
      [255, 255, 0],  // Yellow
      [0, 255, 0],    // Green
      [0, 0, 255],    // Blue
      [75, 0, 130],   // Indigo
      [238, 130, 238] // Violet
    ];
    
    editor.chain().focus().deleteSelection().run();
    
    let html = '';
    const characters = Array.from(selectedText);
    
    // Calculate gradient colors for each character based on its position in the text
    characters.forEach((char, index) => {
      // Calculate normalized position (0-1) within the text
      const position = characters.length > 1 ? index / (characters.length - 1) : 0;
      
      // Calculate position within the rainbow color array
      const segment = position * (rainbowColors.length - 1);
      const segmentIndex = Math.floor(segment);
      const segmentPosition = segment - segmentIndex;
      
      // Get the two colors to interpolate between
      const color1 = rainbowColors[segmentIndex];
      const color2 = rainbowColors[Math.min(segmentIndex + 1, rainbowColors.length - 1)];
      
      // Interpolate between the two colors
      const color: [number, number, number] = [
        Math.round(color1[0] + (color2[0] - color1[0]) * segmentPosition),
        Math.round(color1[1] + (color2[1] - color1[1]) * segmentPosition),
        Math.round(color1[2] + (color2[2] - color1[2]) * segmentPosition)
      ];
      
      const hexColor = rgbToHex(color);
      // Use inline styles for each character
      html += `<span style="color: ${hexColor};">${char}</span>`;
    });
    
    // Insert with special parsing options to preserve our styles
    editor.chain().focus().insertContent(html, {
      parseOptions: {
        preserveWhitespace: 'full',
      },
    }).run();
  }, [editor]);
  
  /**
   * Apply rainbow effect to selected text word by word
   * Each word gets a different color from the rainbow
   */
  const applyRainbowWords = useCallback(() => {
    if (!editor) return;
    
    const { from, to } = editor.state.selection;
    if (from === to) {
      alert('Please select some text first');
      return;
    }
    
    const selectedText = editor.state.doc.textBetween(from, to);
    const words = selectedText.split(/(\s+)/);
    const rainbowColors = [
      [255, 0, 0],    // Red
      [255, 165, 0],  // Orange
      [255, 255, 0],  // Yellow
      [0, 255, 0],    // Green
      [0, 0, 255],    // Blue
      [75, 0, 130],   // Indigo
      [238, 130, 238] // Violet
    ];
    
    editor.chain().focus().deleteSelection().run();
    
    let html = '';
    words.forEach((word, index) => {
      if (word.trim().length === 0) {
        html += word; // Keep whitespace as is
      } else {
        const colorIndex = index % rainbowColors.length;
        const color = rainbowColors[colorIndex];
        const hexColor = rgbToHex(color as [number, number, number]);
        html += `<span style="color: ${hexColor};">${word}</span>`;
      }
    });
    
    editor.chain().focus().insertContent(html).run();
  }, [editor]);
  
  /**
   * Sync editor content with external coloredSegments prop changes
   * Rebuilds editor HTML when segments are updated from outside
   */
  useEffect(() => {
    if (!editor || !coloredSegments || coloredSegments.length === 0) return;
    
    // Don't update the editor while it has focus to prevent disrupting user input
    if (isEditorFocused.current) return;
    
    // Convert segments to HTML
    const sortedSegments = [...coloredSegments].sort((a, b) => a.start - b.start);
    let html = '';
    
    // Get the full text from the editor to use for extracting spaces
    const fullText = editor.getText();
    let lastEnd = 0;
    
    sortedSegments.forEach(segment => {
      // Add any spaces or characters between the last segment and this one
      if (segment.start > lastEnd && lastEnd < fullText.length) {
        const inBetweenText = fullText.substring(lastEnd, segment.start);
        html += inBetweenText;
      }
      
      const hexColor = rgbToHex(segment.color);
      html += `<span style="color: ${hexColor};">${segment.text}</span>`;
      lastEnd = segment.end;
    });
    
    // Add any trailing text after the last segment
    if (lastEnd < fullText.length) {
      html += fullText.substring(lastEnd);
    }
    
    // Only update if content is different to avoid unnecessary rerenders
    const currentHTML = editor.getHTML();
    if (currentHTML.replace(/\s+/g, '') !== html.replace(/\s+/g, '')) {
      editor.commands.setContent(html);
    }
  }, [editor, coloredSegments]);
  
  return (
    <div className={ledDisplayStyles.editorWrapper}>
      <div className={ledDisplayStyles.editorToolbar}>
        <button
          onClick={() => {
            if (editor) {
              const { from, to } = editor.state.selection;
              hasSelectionRef.current = from !== to;
              if (hasSelectionRef.current) {
                lastSelectionRef.current = { from, to };
              }
            }
            setShowColorPicker(!showColorPicker);
          }}
          className={`${ledDisplayStyles.button} ${showColorPicker ? ledDisplayStyles.activeButton : ''}`}
          title="Text Color"
        >
          <div 
            className={ledDisplayStyles.colorSwatch} 
            style={{ backgroundColor: rgbToHex(selectedColor) }}
          ></div>
          <span>Text Color</span>
        </button>
        
        {showColorPicker && (
          <div 
            ref={colorPickerRef}
            className="absolute z-10 mt-16 ml-2 bg-white dark:bg-gray-950 p-4 rounded-xl shadow-xl border-2 border-indigo-200 dark:border-indigo-600"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              minWidth: "320px",
              transform: "translateY(-2%)" 
            }}
          >
            <div className="bg-indigo-100 dark:bg-indigo-950 p-2 -mt-2 -mx-2 mb-3 rounded-t-lg border-b border-indigo-200 dark:border-indigo-700">
              <h3 className="text-sm font-medium text-indigo-800 dark:text-indigo-200 flex items-center">
                <span className="p-1 bg-indigo-200 dark:bg-indigo-900 rounded mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600 dark:text-indigo-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-14a2 2 0 10-4 0v1a2 2 0 104 0V2zm3 0a2 2 0 10-4 0v1a2 2 0 104 0V2zm3 0a2 2 0 10-4 0v1a2 2 0 104 0V2z" clipRule="evenodd" />
                  </svg>
                </span>
                Select Text Color
              </h3>
            </div>
            <ColorPicker 
              color={selectedColor} 
              onChange={applyColor}
            />
            <div className="flex justify-end mt-3 pt-2 border-t border-gray-200 dark:border-gray-800">
              <button 
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                onClick={() => setShowColorPicker(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
        
        <button
          onClick={applyRainbowText}
          className={ledDisplayStyles.button}
          title="Apply rainbow effect to selected text"
        >
          <div className="w-5 h-5 rounded-md bg-gradient-to-r from-red-500 via-green-500 to-blue-500"></div>
          <span>Rainbow Text</span>
        </button>
        
        <button
          onClick={applyRainbowWords}
          className={ledDisplayStyles.button}
          title="Apply rainbow effect per word"
        >
          <div className="w-5 h-5 rounded-md bg-gradient-to-r from-red-500 via-blue-500 to-purple-500"></div>
          <span>Rainbow Words</span>
        </button>
      </div>
      
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
  );
} 