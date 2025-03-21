/**
 * Represents an individual item in a playlist
 */
export interface PlaylistItem {
  id: string;                 // Unique identifier
  content_type: string;       // Type of content being displayed
  text: string;               // The text content to display
  scroll: boolean;            // Whether text should scroll
  color: [number, number, number]; // RGB color values for the text
  speed: number;              // Animation speed
  duration: number;           // How long the item displays
  repeat_count: number;       // Number of times to repeat
  border_effect: {
    [key: string]: BorderEffectValue;
  };                          // Effects applied to borders
  colored_segments?: Array<{
    start: number;
    end: number;
    text: string;
    color: [number, number, number];
  }> | null;                  // Optional segments with different colors
}

/**
 * Defines possible values for border effects
 * Can be null or an object with properties
 */
export type BorderEffectValue = null | {
  colors?: Array<[number, number, number]>; // Array of RGB color values
  // Add other possible properties here if needed
};

/**
 * Represents a collection of playlist items and playback settings
 */
export interface Playlist {
  items: PlaylistItem[];      // Array of items in the playlist
  active_index: number;       // Current active item index
  repeat: boolean;            // Whether to repeat the playlist
  brightness: number;         // Display brightness level
}

/**
 * Message structure for user feedback
 */
export interface StatusMessage {
  message: string;            // Content of the message
  type: 'success' | 'error' | 'info'; // Type of message for styling
}

/**
 * Props for the StatusMessage component
 */
export interface StatusMessageProps {
  status: {
    message: string;
    type: "error" | "success" | "info";
  };                          // Status message details
  onClose: () => void;        // Handler for closing the message
} 