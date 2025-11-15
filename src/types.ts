/**
 * Common types used throughout the application
 */

/**
 * Type for an RGB color represented as a tuple
 */
export type RGBColor = [number, number, number];

export interface ImageTransform {
  x: number;
  y: number;
  scale: number;
}

export interface ImageKeyframe {
  timestamp_ms: number;
  x: number;
  y: number;
  scale: number;
}

export interface ImageAnimation {
  keyframes: ImageKeyframe[];
  iterations?: number | null;
}

export interface ImageContent {
  image_id: string;
  natural_width: number;
  natural_height: number;
  transform: ImageTransform;
  animation?: ImageAnimation | null;
}

export type ImageContentDetails = { type: 'Image' } & ImageContent;

export type ClockFormat = '24h' | '12h';

export interface ClockContent {
  format: ClockFormat;
  show_seconds: boolean;
  color: RGBColor;
}

export type ClockContentDetails = { type: 'Clock' } & ClockContent;

/**
 * Enum representing content types supported by the system
 */
export enum ContentType {
  Text = 'Text',
  Image = 'Image',
  Animation = 'Animation',
  Clock = 'Clock'
  // Future types can be added here
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

export type TextContentDetails = { type: 'Text' } & TextContent;

/**
 * Union type for different content details based on content type
 */
export type ContentDetails = TextContentDetails | ImageContentDetails | ClockContentDetails;

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

export interface DisplayInfo {
  width: number;
  height: number;
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