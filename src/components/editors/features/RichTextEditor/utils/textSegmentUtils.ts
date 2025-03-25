import { TextSegment, RGBColor } from '../../../../../types';
import { rgbToHex } from '../../../../../utils/colorUtils';

/**
 * Utility functions for working with text segments
 */

/**
 * Generates HTML from a list of text segments
 * @param fullText - The complete text content
 * @param segments - Array of text segments with formatting
 * @returns HTML string with formatted segments
 */
export function generateHtmlFromSegments(
  fullText: string,
  segments: TextSegment[]
): string {
  if (!segments.length) return fullText;
  
  // Sort segments by start position
  const sortedSegments = [...segments].sort((a, b) => a.start - b.start);
  let html = '';
  let lastEnd = 0;
  
  // Process each segment
  sortedSegments.forEach(segment => {
    // Add any text between segments
    if (segment.start > lastEnd) {
      html += fullText.substring(lastEnd, segment.start);
    }
    
    // Extract segment text
    const segmentText = fullText.substring(segment.start, segment.end);
    
    // Build formatted HTML
    let formattedText = segmentText;
    const { formatting, color } = segment;
    
    // Apply formatting
    if (formatting) {
      if (formatting.bold) formattedText = `<strong>${formattedText}</strong>`;
      if (formatting.strikethrough) formattedText = `<s>${formattedText}</s>`;
      if (formatting.underline) formattedText = `<u>${formattedText}</u>`;
    }
    
    // Apply color
    if (color) {
      formattedText = `<span style="color: ${rgbToHex(color)};">${formattedText}</span>`;
    }
    
    html += formattedText;
    lastEnd = segment.end;
  });
  
  // Add any remaining text
  if (lastEnd < fullText.length) {
    html += fullText.substring(lastEnd);
  }
  
  return html;
}

/**
 * Gets formatting info from an HTML element
 */
function getElementFormatting(element: Element): {
  isBold: boolean;
  isStrikethrough: boolean;
  isUnderlined: boolean;
  textColor?: RGBColor;
} {
  let isBold = false;
  let isStrikethrough = false;
  let isUnderlined = false;
  let textColor: RGBColor | undefined = undefined;
  
  // Check element style
  if (element instanceof HTMLElement && element.style.color) {
    const colorStr = element.style.color;
    const rgbMatch = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    
    if (rgbMatch) {
      textColor = [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])];
    }
  }
  
  // Check element formatting
  const style = window.getComputedStyle(element);
  isBold = style.fontWeight === 'bold' || 
    element.tagName === 'STRONG' || 
    element.tagName === 'B';
    
  isStrikethrough = style.textDecoration.includes('line-through') || 
    element.tagName === 'S' || 
    element.tagName === 'STRIKE' || 
    element.tagName === 'DEL';
    
  isUnderlined = style.textDecoration.includes('underline') || 
    element.tagName === 'U';
    
  return { isBold, isStrikethrough, isUnderlined, textColor };
}

/**
 * Extracts text segments from HTML content
 * @param html - HTML content
 * @returns Array of text segments with formatting information
 */
export function extractSegmentsFromHtml(html: string): TextSegment[] {
  const segments: TextSegment[] = [];
  
  // Early return in non-browser environments
  if (typeof document === 'undefined') return segments;
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  let currentIndex = 0;
  
  // Process a node and its children
  function processNode(node: Node) {
    // Handle text nodes
    if (node.nodeType === Node.TEXT_NODE && node.textContent) {
      const parentElement = node.parentElement;
      const text = node.textContent;
      
      // If no parent or empty text, skip
      if (!parentElement || !text.length) {
        currentIndex += text.length;
        return;
      }
      
      // Get formatting from element chain
      const formatting = { 
        isBold: false, 
        isStrikethrough: false, 
        isUnderlined: false, 
        textColor: undefined as RGBColor | undefined 
      };
      let currentEl: Element | null = parentElement;
      
      // Check element and all parents for formatting
      while (currentEl) {
        const elFormatting = getElementFormatting(currentEl);
        
        // Only update properties that aren't already set
        formatting.isBold = formatting.isBold || elFormatting.isBold;
        formatting.isStrikethrough = formatting.isStrikethrough || elFormatting.isStrikethrough;
        formatting.isUnderlined = formatting.isUnderlined || elFormatting.isUnderlined;
        
        // Use first encountered color
        if (!formatting.textColor && elFormatting.textColor) {
          formatting.textColor = elFormatting.textColor;
        }
        
        currentEl = currentEl.parentElement;
      }
      
      // Create segment
      const segment: TextSegment = {
        start: currentIndex,
        end: currentIndex + text.length
      };
      
      // Add formatting if any found
      if (formatting.isBold || formatting.isStrikethrough || formatting.isUnderlined) {
        segment.formatting = {
          ...(formatting.isBold && { bold: true }),
          ...(formatting.isStrikethrough && { strikethrough: true }),
          ...(formatting.isUnderlined && { underline: true })
        };
      }
      
      // Add color if found
      if (formatting.textColor) {
        segment.color = formatting.textColor;
      }
      
      segments.push(segment);
      currentIndex += text.length;
    } 
    // Process element nodes
    else if (node.nodeType === Node.ELEMENT_NODE) {
      Array.from(node.childNodes).forEach(processNode);
    }
  }
  
  // Process all root nodes
  Array.from(tempDiv.childNodes).forEach(processNode);
  
  return segments;
} 