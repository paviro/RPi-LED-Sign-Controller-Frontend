/**
 * Represents an item in a playlist that can be displayed as text with various visual effects.
 */
export interface TextSegment {
  start: number;
  end: number;
  color?: [number, number, number];
  formatting?: {
    bold?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
  };
}

export type ColorArray = Array<[number, number, number]>;

export type BorderEffect = 
  | { None: null }
  | { Rainbow: null }
  | { Pulse: { colors: ColorArray } }
  | { Sparkle: { colors: ColorArray } }
  | { Gradient: { colors: ColorArray } };

export interface PlaylistItem {
  /** Unique identifier for the playlist item */
  id: string;
  /** The type of content - currently only supports 'Text' */
  content_type: string;
  /** The text content to be displayed */
  text: string;
  /** RGB color for the text as [r, g, b] values (0-255) */
  color?: [number, number, number];
  /** Whether the text should scroll across the display */
  scroll?: boolean;
  /** The scrolling speed (higher = faster) */
  speed?: number;
  /** How long the item should be displayed in seconds */
  duration?: number;
  /** Number of times to repeat the item (0 = infinite) */
  repeat_count?: number;
  /** Visual border effect to apply to the text */
  border_effect?: BorderEffect;
  /** Optional colored text segments (null if not using colored segments) */
  text_segments?: TextSegment[];
  
  // @deprecated - For backward compatibility only
  colored_segments?: Array<{ text: string; color: [number, number, number] }>;
}

/**
 * Represents a collection of playlist items with playback configuration.
 */
export interface Playlist {
  /** Array of items in the playlist */
  items: PlaylistItem[];
  /** Index of the currently active item (undefined if no item is active) */
  active_index?: number;
  /** Whether the playlist should repeat after finishing */
  repeat?: boolean;
}

/**
 * Props for the StatusMessage component used to display notifications.
 */
export interface StatusMessageProps {
  /** Status information to display */
  status: {
    /** The message text */
    message: string;
    /** The type of status message which determines styling */
    type: 'error' | 'success' | 'info';
  };
  /** Function to call when closing the status message */
  onClose: () => void;
} 