import { PlaylistItem } from '../../../../types';

export type ImageKeyframe = {
  timestamp_ms: number;
  x: number;
  y: number;
  scale: number;
};

export type ImageDetails = {
  type: 'Image';
  image_id: string;
  natural_width: number;
  natural_height: number;
  transform: {
    x: number;
    y: number;
    scale: number;
  };
  animation?: {
    keyframes: ImageKeyframe[];
    iterations?: number | null;
  } | null;
};

export type Transform = {
  x: number;
  y: number;
  scale: number;
};

export type EditorStatus = {
  message: string;
  type: 'error' | 'success' | 'info';
};

export type ImageEditorForm = Partial<PlaylistItem> & {
  content?: {
    data: ImageDetails;
  };
};

