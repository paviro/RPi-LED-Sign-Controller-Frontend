/**
 * Represents an item in a playlist that can be displayed as text with various visual effects.
 */
export interface PlaylistItem {
  /** Unique identifier for the playlist item */
  id: string;
  /** The type of content - currently only supports 'Text' */
  content_type: 'Text';
  /** The text content to be displayed */
  text: string;
  /** Whether the text should scroll across the display */
  scroll: boolean;
  /** RGB color for the text as [r, g, b] values (0-255) */
  color: [number, number, number];
  /** The scrolling speed (higher = faster) */
  speed: number;
  /** How long the item should be displayed in seconds */
  duration: number;
  /** Number of times to repeat the item (0 = infinite) */
  repeat_count: number;
  /** Visual border effect to apply to the text */
  border_effect: 
    | { None: null }
    | { Rainbow: null }
    | { Pulse: { colors: Array<[number, number, number]> } }
    | { Sparkle: { colors: Array<[number, number, number]> } }
    | { Gradient: { colors: Array<[number, number, number]> } };
  /** Optional colored text segments (null if not using colored segments) */
  colored_segments?: Array<{
    /** Starting character index */
    start: number;
    /** Ending character index (exclusive) */
    end: number;
    /** The text segment content */
    text: string;
    /** RGB color for this segment as [r, g, b] values (0-255) */
    color: [number, number, number];
  }> | null;
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