import { useCallback } from 'react';
import { Editor } from '@tiptap/react';

type TextSegment = {
  start: number;
  end: number;
  color?: [number, number, number];
  formatting?: {
    bold?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
  };
};

interface UseRainbowEffectsProps {
  editor: Editor | null;
  rgbToHex: (rgb: [number, number, number]) => string;
  textSegments: Array<TextSegment>;
  processColorSegmentsWithSpaces: (html: string) => void;
  withPreservedSelection: (operation: () => void) => void;
}

export const useRainbowEffects = ({
  editor,
  rgbToHex,
  textSegments,
  processColorSegmentsWithSpaces,
  withPreservedSelection
}: UseRainbowEffectsProps) => {
  
  /**
   * Generate rainbow HTML with each character having a different color
   */
  const generateCharacterRainbowHtml = useCallback((
    text: string,
    rainbowColors: Array<[number, number, number]>,
    relevantSegments: Array<TextSegment>,
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
  }, [rgbToHex]);

  /**
   * Generate rainbow HTML with each word having a different color
   */
  const generateWordRainbowHtml = useCallback((
    text: string,
    rainbowColors: Array<[number, number, number]>,
    relevantSegments: Array<TextSegment>,
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
  }, [rgbToHex]);

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
  }, [
    editor, 
    textSegments, 
    processColorSegmentsWithSpaces, 
    withPreservedSelection, 
    generateCharacterRainbowHtml, 
    generateWordRainbowHtml
  ]);

  return { applyRainbowEffect };
}; 