import { useCallback } from 'react';

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

interface UseSegmentProcessingProps {
  onSegmentsChange: (segments: Array<TextSegment>) => void;
}

export const useSegmentProcessing = ({ onSegmentsChange }: UseSegmentProcessingProps) => {
  /**
   * Process HTML content to extract text segments for LED display
   * Parses DOM nodes from editor HTML to identify colored and formatted text segments
   */
  const processColorSegmentsWithSpaces = useCallback((html: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const segments: Array<TextSegment> = [];
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
        
        const segment: TextSegment = {
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

  return { processColorSegmentsWithSpaces };
}; 