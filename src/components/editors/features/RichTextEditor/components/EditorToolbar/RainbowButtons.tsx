interface RainbowButtonsProps {
  styles: {
    button: string;
  };
  applyRainbowEffect: (mode: 'character' | 'word') => void;
}

export default function RainbowButtons({
  styles,
  applyRainbowEffect
}: RainbowButtonsProps) {
  return (
    <>
      <button
        onClick={() => applyRainbowEffect('character')}
        className={styles.button}
        title="Apply rainbow effect to selected text"
      >
        <div className="w-5 h-5 rounded-md bg-gradient-to-r from-red-500 via-green-500 to-blue-500"></div>
        <span>Letters</span>
      </button>
      
      <button
        onClick={() => applyRainbowEffect('word')}
        className={styles.button}
        title="Apply rainbow effect per word"
      >
        <div className="w-5 h-5 rounded-md bg-gradient-to-r from-red-500 via-blue-500 to-purple-500"></div>
        <span>Words</span>
      </button>
    </>
  );
} 