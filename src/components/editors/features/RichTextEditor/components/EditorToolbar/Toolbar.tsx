import { Editor } from '@tiptap/react';
import { MutableRefObject } from 'react';
import FormatButtons from './FormatButtons';
import ColorButton from './ColorButton';
import RainbowButtons from './RainbowButtons';

interface ToolbarProps {
  editor: Editor | null;
  styles: {
    editorToolbar: string;
    button: string;
    activeButton: string;
    colorSwatch: string;
  };
  selectedColor: [number, number, number];
  isBold: boolean;
  isStrikethrough: boolean;
  isUnderline: boolean;
  toggleFormat: (format: 'bold' | 'strike' | 'underline') => void;
  applyColor: (color: [number, number, number]) => void;
  applyRainbowEffect: (mode: 'character' | 'word') => void;
  showColorPicker: boolean;
  setShowColorPicker: (show: boolean) => void;
  colorPickerRef: React.RefObject<HTMLDivElement>;
  hasSelectionRef: MutableRefObject<boolean>;
  lastSelectionRef: MutableRefObject<{ from: number; to: number } | null>;
  rgbToHex: (rgb: [number, number, number]) => string;
}

export default function Toolbar({
  editor,
  styles,
  selectedColor,
  isBold,
  isStrikethrough,
  isUnderline,
  toggleFormat,
  applyColor,
  applyRainbowEffect,
  showColorPicker,
  setShowColorPicker,
  colorPickerRef,
  hasSelectionRef,
  lastSelectionRef,
  rgbToHex
}: ToolbarProps) {
  return (
    <div className={`${styles.editorToolbar} flex justify-between items-center`}>
      <div className="flex items-center gap-x-3">
        <ColorButton
          editor={editor}
          styles={{
            button: styles.button,
            activeButton: styles.activeButton,
            colorSwatch: styles.colorSwatch
          }}
          selectedColor={selectedColor}
          showColorPicker={showColorPicker}
          setShowColorPicker={setShowColorPicker}
          colorPickerRef={colorPickerRef}
          applyColor={applyColor}
          hasSelectionRef={hasSelectionRef}
          lastSelectionRef={lastSelectionRef}
          rgbToHex={rgbToHex}
        />
        
        <FormatButtons
          editor={editor}
          styles={{
            button: styles.button,
            activeButton: styles.activeButton
          }}
          isBold={isBold}
          isStrikethrough={isStrikethrough}
          isUnderline={isUnderline}
          toggleFormat={toggleFormat}
        />
      </div>
      
      <div className="flex items-center gap-x-3">
        <RainbowButtons
          styles={{
            button: styles.button
          }}
          applyRainbowEffect={applyRainbowEffect}
        />
      </div>
    </div>
  );
} 