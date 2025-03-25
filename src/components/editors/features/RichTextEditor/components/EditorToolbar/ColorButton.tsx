import { Editor } from '@tiptap/react';
import { useRef, useState } from 'react';
import ColorPicker from '../../../../common/ColorPicker';

interface ColorButtonProps {
  editor: Editor | null;
  styles: {
    button: string;
    activeButton: string;
    colorSwatch: string;
  };
  selectedColor: [number, number, number];
  showColorPicker: boolean;
  setShowColorPicker: (show: boolean) => void;
  colorPickerRef: React.RefObject<HTMLDivElement>;
  applyColor: (color: [number, number, number]) => void;
  hasSelectionRef: { current: boolean };
  lastSelectionRef: { current: { from: number; to: number } | null };
  rgbToHex: (rgb: [number, number, number]) => string;
}

export default function ColorButton({
  editor,
  styles,
  selectedColor,
  showColorPicker,
  setShowColorPicker,
  colorPickerRef,
  applyColor,
  hasSelectionRef,
  lastSelectionRef,
  rgbToHex
}: ColorButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [pickerStyle, setPickerStyle] = useState({ top: 0, left: 0 });
  
  // Calculate position and toggle picker
  const toggleColorPicker = () => {
    if (editor) {
      const { from, to } = editor.state.selection;
      hasSelectionRef.current = from !== to;
      if (hasSelectionRef.current) {
        lastSelectionRef.current = { from, to };
      }
    }
    
    // If we're about to show the picker, calculate position first
    if (!showColorPicker && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      setPickerStyle({
        top: buttonRect.bottom + window.scrollY + 10,
        left: buttonRect.left + window.scrollX
      });
    }
    
    // Toggle the picker visibility
    setShowColorPicker(!showColorPicker);
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggleColorPicker}
        className={`${styles.button} ${showColorPicker ? styles.activeButton : ''}`}
        title="Text Color"
      >
        <div 
          className={styles.colorSwatch} 
          style={{ backgroundColor: rgbToHex(selectedColor) }}
        ></div>
      </button>
      
      {showColorPicker && (
        <div 
          ref={colorPickerRef}
          className="fixed z-50 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-xl border-2 border-indigo-200 dark:border-indigo-600"
          onClick={(e) => e.stopPropagation()}
          style={{ 
            minWidth: "320px",
            top: `${pickerStyle.top}px`,
            left: `${pickerStyle.left}px`
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
    </>
  );
} 