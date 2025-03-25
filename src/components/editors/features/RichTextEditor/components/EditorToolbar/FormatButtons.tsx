import { Editor } from '@tiptap/react';
import { ImBold, ImStrikethrough, ImUnderline } from "react-icons/im";

interface FormatButtonsProps {
  editor: Editor | null;
  styles: {
    button: string;
    activeButton: string;
  };
  isBold: boolean;
  isStrikethrough: boolean;
  isUnderline: boolean;
  toggleFormat: (format: 'bold' | 'strike' | 'underline') => void;
}

export default function FormatButtons({
  editor,
  styles,
  isBold,
  isStrikethrough,
  isUnderline,
  toggleFormat
}: FormatButtonsProps) {
  if (!editor) return null;
  
  return (
    <>
      <button
        onClick={() => toggleFormat('bold')}
        className={`${styles.button} ${isBold ? styles.activeButton : ''}`}
        title="Bold"
      >
        <ImBold className="h-5 w-5" />
      </button>
      
      <button
        onClick={() => toggleFormat('strike')}
        className={`${styles.button} ${isStrikethrough ? styles.activeButton : ''}`}
        title="Strikethrough"
      >
        <ImStrikethrough className="h-5 w-5" />
      </button>
      
      <button
        onClick={() => toggleFormat('underline')}
        className={`${styles.button} ${isUnderline ? styles.activeButton : ''}`}
        title="Underline"
      >
        <ImUnderline className="h-5 w-5" />
      </button>
    </>
  );
} 