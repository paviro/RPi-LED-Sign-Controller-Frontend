'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import { useEffect, useCallback, useState, useRef } from 'react';
import ColorPicker from './ColorPicker';

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
  
  // Track active formatting states
  const [isBold, setIsBold] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  
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
      StarterKit.configure({
        // Configure to not override other marks when toggling marks
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

  // Helper function to update formatting button states
  const updateFormattingStates = useCallback((editor: Editor) => {
    if (!editor) return;
    
    setIsBold(editor.isActive('bold'));
    setIsStrikethrough(editor.isActive('strike'));
    setIsUnderline(editor.isActive('underline'));
  }, []);

  /**
   * Process HTML content to extract text segments for LED display
   * Parses DOM nodes from editor HTML to identify colored and formatted text segments
   */
  const processColorSegmentsWithSpaces = useCallback((html: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const segments: Array<{start: number; end: number; color?: [number, number, number]; formatting?: {bold?: boolean; strikethrough?: boolean; underline?: boolean}}> = [];
    let currentIndex = 0;
    
    // Process DOM nodes recursively to extract text and formatting information
    const processNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent !== null) {
        // Check for parent node and any ancestor formatting
        const parentElement = node.parentElement;
        let isBold = false;
        let isStrikethrough = false;
        let isUnderlined = false;
        let textColor: [number, number, number] | undefined = undefined;
        
        // Check for formatting in the current node and its ancestors
        if (parentElement) {
          // First check for directly applied color
          if (parentElement.style.color) {
            const colorStr = parentElement.style.color;
            const rgbMatch = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            
            if (rgbMatch) {
              textColor = [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])];
            }
          }
          
          // Check current node and its ancestors for formatting
          let currentElement: Element | null = parentElement;
          while (currentElement) {
            // Check for bold
            if (!isBold) {
              isBold = window.getComputedStyle(currentElement).fontWeight === 'bold' || 
                       currentElement.tagName === 'STRONG' || 
                       currentElement.tagName === 'B';
            }
            
            // Check for strikethrough
            if (!isStrikethrough) {
              isStrikethrough = window.getComputedStyle(currentElement).textDecoration.includes('line-through') || 
                             currentElement.tagName === 'S' || 
                             currentElement.tagName === 'STRIKE' || 
                             currentElement.tagName === 'DEL';
            }
            
            // Check for underline
            if (!isUnderlined) {
              isUnderlined = window.getComputedStyle(currentElement).textDecoration.includes('underline') || 
                             currentElement.tagName === 'U';
            }
            
            // Check for color if not found yet
            if (!textColor && currentElement instanceof HTMLElement && currentElement.style.color) {
              const colorStr = currentElement.style.color;
              const rgbMatch = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
              
              if (rgbMatch) {
                textColor = [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])];
              }
            }
            
            // Move up to parent element
            currentElement = currentElement.parentElement;
          }
        }
        
        const segment: {
          start: number;
          end: number;
          color?: [number, number, number];
          formatting?: {
            bold?: boolean;
            strikethrough?: boolean;
            underline?: boolean;
          };
        } = {
          start: currentIndex,
          end: currentIndex + node.textContent.length
        };
        
        // Set color if found
        if (textColor) {
          segment.color = textColor;
        }
        
        // Add formatting if any is detected
        if (isBold || isStrikethrough || isUnderlined) {
          segment.formatting = {
            ...(isBold && { bold: true }),
            ...(isStrikethrough && { strikethrough: true }),
            ...(isUnderlined && { underline: true })
          };
        }
        
        const text = node.textContent;
        currentIndex += text.length;
        
        segments.push(segment);
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
   * Helper function to preserve and restore text selection
   */
  const withPreservedSelection = useCallback((operation: () => void) => {
    if (!editor) return;
    
    // Store current selection
    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;
    
    // Save for later use if needed
    if (hasSelection) {
      lastSelectionRef.current = { from, to };
      hasSelectionRef.current = true;
    }
    
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
  }, [editor]);

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
  }, [editor, onColorChange, withPreservedSelection]);

  /**
   * Helper functions to generate rainbow HTML
   */
  // Define the rainbow HTML generation functions first
  const generateCharacterRainbowHtml = useCallback((
    text: string,
    rainbowColors: Array<[number, number, number]>,
    relevantSegments: typeof textSegments,
    startPosition: number
  ) => {
    const characters = Array.from(text);
    
    // Group characters by their formatting
    interface CharGroup {
      chars: string[];
      formatting: {
        bold?: boolean;
        strikethrough?: boolean;
        underline?: boolean;
      } | null;
      startColor: number;
    }
    
    const charGroups: CharGroup[] = [];
    let currentGroup: CharGroup | null = null;
    
    // Group characters by formatting
    for (let i = 0; i < characters.length; i++) {
      const position = startPosition + i;
      const char = characters[i];
      
      // Find segment this character belongs to
      const segment = relevantSegments.find(seg => 
        position >= seg.start && position < seg.end
      );
      
      // Determine if this needs a new group
      const isNewGroup = !currentGroup || 
        JSON.stringify(currentGroup.formatting) !== JSON.stringify(segment?.formatting);
      
      if (isNewGroup) {
        currentGroup = {
          chars: [char],
          formatting: segment?.formatting || null,
          startColor: i
        };
        charGroups.push(currentGroup);
      } else if (currentGroup) {
        currentGroup.chars.push(char);
      }
    }
    
    // Generate HTML from groups
    let html = '';
    
    charGroups.forEach(group => {
      if (group.chars.length === 0) return;
      
      const formattedText = group.chars.join('');
      
      // Handle whitespace differently
      if (/^\s+$/.test(formattedText)) {
        // Use single color for whitespace
        const colorIndex = Math.max(0, group.startColor - 1) % rainbowColors.length;
        const color = rainbowColors[colorIndex] as [number, number, number];
        html += `<span style="color: ${rgbToHex(color)}">${formattedText}</span>`;
      } else {
        // Apply rainbow colors to each character
        let coloredHtml = '';
        
        group.chars.forEach((char, idx) => {
          const i = group.startColor + idx;
          // Calculate rainbow color
          const normalizedPos = characters.length > 1 ? i / (characters.length - 1) : 0;
          const colorSegment = normalizedPos * (rainbowColors.length - 1);
          const segmentIndex = Math.floor(colorSegment);
          const segmentPosition = colorSegment - segmentIndex;
          
          // Interpolate colors
          const color1 = rainbowColors[segmentIndex];
          const color2 = rainbowColors[Math.min(segmentIndex + 1, rainbowColors.length - 1)];
          
          const color: [number, number, number] = [
            Math.round(color1[0] + (color2[0] - color1[0]) * segmentPosition),
            Math.round(color1[1] + (color2[1] - color1[1]) * segmentPosition),
            Math.round(color1[2] + (color2[2] - color1[2]) * segmentPosition)
          ];
          
          coloredHtml += `<span style="color: ${rgbToHex(color)}">${char}</span>`;
        });
        
        // Apply formatting to the group
        if (group.formatting) {
          if (group.formatting.bold) coloredHtml = `<strong>${coloredHtml}</strong>`;
          if (group.formatting.strikethrough) coloredHtml = `<s>${coloredHtml}</s>`;
          if (group.formatting.underline) coloredHtml = `<u>${coloredHtml}</u>`;
        }
        
        html += coloredHtml;
      }
    });
    
    return html;
  }, []);

  const generateWordRainbowHtml = useCallback((
    text: string,
    rainbowColors: Array<[number, number, number]>,
    relevantSegments: typeof textSegments,
    startPosition: number
  ) => {
    // Split into words
    const words = text.split(/(\s+)/);
    
    // Calculate word positions
    const wordPositions = [];
    let currentPos = startPosition;
    
    for (const word of words) {
      wordPositions.push({
        start: currentPos,
        end: currentPos + word.length,
        text: word
      });
      currentPos += word.length;
    }
    
    // Generate HTML for each word
    let html = '';
    
    wordPositions.forEach((word, index) => {
      if (word.text.trim().length === 0) {
        // Keep whitespace as is
        html += word.text;
      } else {
        // Calculate color for this word
        const colorIndex = index % rainbowColors.length;
        const color = rainbowColors[colorIndex] as [number, number, number];
        const spanStart = `<span style="color: ${rgbToHex(color)}">`;
        
        // Find segments for this word
        const wordSegments = relevantSegments.filter(seg => 
          seg.start < word.end && seg.end > word.start
        );
        
        // Apply formatting if present
        if (wordSegments.length > 0) {
          const segment = wordSegments[0];
          let formattedWord = word.text;
          
          if (segment.formatting) {
            if (segment.formatting.bold) formattedWord = `<strong>${formattedWord}</strong>`;
            if (segment.formatting.strikethrough) formattedWord = `<s>${formattedWord}</s>`;
            if (segment.formatting.underline) formattedWord = `<u>${formattedWord}</u>`;
          }
          
          html += `${spanStart}${formattedWord}</span>`;
        } else {
          html += `${spanStart}${word.text}</span>`;
        }
      }
    });
    
    return html;
  }, []);

  /**
   * Apply rainbow effect to selected text while preserving selection
   */
  const applyRainbowEffect = useCallback((mode: 'character' | 'word') => {
    if (!editor) return;
    
    const { from, to } = editor.state.selection;
    if (from === to) {
      alert('Please select some text first');
      return;
    }
    
    // Get the selected text
    const selectedText = editor.state.doc.textBetween(from, to);
    
    // Analyze text formatting
    processColorSegmentsWithSpaces(editor.getHTML());
    
    // Define rainbow colors with proper typing
    const rainbowColors: Array<[number, number, number]> = [
      [255, 0, 0],    // Red
      [255, 165, 0],  // Orange
      [255, 255, 0],  // Yellow
      [0, 255, 0],    // Green
      [0, 0, 255],    // Blue
      [75, 0, 130],   // Indigo
      [238, 130, 238] // Violet
    ];
    
    let html = '';
    
    if (mode === 'character') {
      // Character-by-character rainbow effect
      html = generateCharacterRainbowHtml(
        selectedText, 
        rainbowColors, 
        textSegments, 
        from
      );
    } else {
      // Word-by-word rainbow effect
      html = generateWordRainbowHtml(
        selectedText, 
        rainbowColors, 
        textSegments, 
        from
      );
    }
    
    // Apply the rainbow content with preserved selection
    withPreservedSelection(() => {
      editor.chain().focus().deleteSelection().run();
      editor.chain().focus().insertContent(html, {
        parseOptions: {
          preserveWhitespace: 'full',
        },
      }).run();
    });
  }, [editor, textSegments, processColorSegmentsWithSpaces, withPreservedSelection, generateCharacterRainbowHtml, generateWordRainbowHtml]);

  /**
   * Sync editor content with external textSegments prop changes
   * Rebuilds editor HTML when segments are updated from outside
   */
  useEffect(() => {
    if (!editor || !textSegments || textSegments.length === 0) return;
    
    // Don't update the editor while it has focus to prevent disrupting user input
    if (isEditorFocused.current) return;
    
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
    
    // Only update if content is different to avoid unnecessary rerenders
    const currentHTML = editor.getHTML();
    if (currentHTML.replace(/\s+/g, '') !== html.replace(/\s+/g, '')) {
      editor.commands.setContent(html);
    }
  }, [editor, textSegments]);
  
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
            className="absolute z-10 mt-16 ml-2 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-xl border-2 border-indigo-200 dark:border-indigo-600"
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
          onClick={() => toggleFormat('bold')}
          className={`${ledDisplayStyles.button} ${isBold ? ledDisplayStyles.activeButton : ''}`}
          title="Bold"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 5h3.25c1.73 0 2.75 1 2.75 2.15 0 .94-.54 1.68-1.16 2.02.04.07.08.14.12.21.75.52 1.29 1.43 1.29 2.38C12.25 13.74 10.82 15 8.75 15H6V5zm1.5 1.5v2.5h1.75c.83 0 1.25-.67 1.25-1.25s-.42-1.25-1.25-1.25H7.5zm0 4v3h1.25c1.08 0 1.75-.65 1.75-1.5s-.67-1.5-1.75-1.5H7.5z" clipRule="evenodd" />
          </svg>
          <span>Bold</span>
        </button>
        
        <button
          onClick={() => toggleFormat('strike')}
          className={`${ledDisplayStyles.button} ${isStrikethrough ? ledDisplayStyles.activeButton : ''}`}
          title="Strikethrough"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 4.5c2.69 0 4.88 1.47 4.88 3.5 0 1.38-1.52 2.26-2.22 2.63-.46.24-.99.36-1.55.45-.31.05-.62.1-.91.14H6v1.56h5.41c-.11.07-.24.14-.34.2-1.01.63-1.57 1.39-1.57 2.43 0 1.77 1.76 3.2 3.92 3.2 1.4 0 2.63-.5 3.41-1.35l-1.1-1.55c-.38.43-1.32.91-2.31.91-1.39 0-2.44-.8-2.44-1.71 0-.57.4-.93.95-1.21.17-.09.34-.16.52-.22h3.05l.34-2h-3.96c.39-.1.77-.24 1.13-.43.57-.29 1-.73 1-1.31 0-.87-1.05-1.61-2.33-1.61-1.56 0-2.53.95-2.95 1.45l1.24 1.22c.25-.35.77-.92 1.71-.92zm0-3c-4.42 0-8 2.24-8 5 0 1.3.58 2.42 1.7 3.28.18.14.37.27.56.39H3V17h5v-1l.5-.12c1.5-.36 2.43-.93 3.12-1.66.28-.3.51-.64.7-1.01h3.18l-1-7c-.19-1.33-2.25-3.71-5.5-3.71z" />
          </svg>
          <span>Strikethrough</span>
        </button>
        
        <button
          onClick={() => toggleFormat('underline')}
          className={`${ledDisplayStyles.button} ${isUnderline ? ledDisplayStyles.activeButton : ''}`}
          title="Underline"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 16v1h10v-1H5zm1.5-11.5v6.75c0 1.93 1.57 3.5 3.5 3.5s3.5-1.57 3.5-3.5V4.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v6.75c0 .28-.22.5-.5.5s-.5-.22-.5-.5V4.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5z" />
          </svg>
          <span>Underline</span>
        </button>
        
        <button
          onClick={() => applyRainbowEffect('character')}
          className={ledDisplayStyles.button}
          title="Apply rainbow effect to selected text"
        >
          <div className="w-5 h-5 rounded-md bg-gradient-to-r from-red-500 via-green-500 to-blue-500"></div>
          <span>Rainbow Text</span>
        </button>
        
        <button
          onClick={() => applyRainbowEffect('word')}
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