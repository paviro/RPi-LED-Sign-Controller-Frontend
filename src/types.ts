/**
 * Common types used throughout the application
 */

/**
 * Type for an RGB color represented as a tuple
 */
export type RGBColor = [number, number, number];

/**
 * Enum representing content types supported by the system
 */
export enum ContentType {
  Text = 'Text',
  // Future types will be added here: Image, Clock, Animation, etc.
}

/**
 * Text formatting options for text segments
 */
export interface TextFormatting {
  bold?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
}

/**
 * A segment of text with optional formatting and color
 */
export interface TextSegment {
  start: number;         // Start index in the text (character position)
  end: number;           // End index in the text (exclusive)
  color?: RGBColor;      // RGB color values
  formatting?: TextFormatting; // Optional formatting properties
}

/**
 * Text-specific content properties
 */
export interface TextContent {
  text: string;
  scroll: boolean;
  color: RGBColor;
  speed: number;
  text_segments?: TextSegment[];
}

/**
 * Union type for different content details based on content type
 */
export type ContentDetails = 
  | { type: 'Text'; } & TextContent
  // Future types will be added here: Image, Clock, etc.

/**
 * Content data structure that includes the type and specific details
 */
export interface ContentData {
  type: ContentType;
  data: ContentDetails;
}

/**
 * Border effect types matching the Rust implementation
 */
export type BorderEffect = 
  | { None: null }
  | { Rainbow: null }
  | { Pulse: { colors: Array<RGBColor> } }
  | { Sparkle: { colors: Array<RGBColor> } }
  | { Gradient: { colors: Array<RGBColor> } };

/**
 * Main playlist item structure matching DisplayContent in the backend
 */
export interface PlaylistItem {
  id: string;
  duration?: number;        // Display duration in seconds (optional)
  repeat_count?: number;    // Number of times to repeat (optional)
  border_effect: BorderEffect | null; // Optional border effect
  content: ContentData;
}

/**
 * Playlist collection structure
 */
export interface Playlist {
  items: PlaylistItem[];
  active_index: number;
  repeat: boolean;
}

/**
 * Request structure for reordering playlist items
 */
export interface ReorderRequest {
  item_ids: string[];
}

/**
 * Settings for display brightness
 */
export interface BrightnessSettings {
  brightness: number;
}

/**
 * Preview mode state
 */
export interface PreviewModeState {
  active: boolean;
}

/**
 * Props for the StatusMessage component
 */
export interface StatusMessageProps {
  status: {
    message: string;
    type: 'error' | 'success' | 'info';
  };
  onClose: () => void;
} 