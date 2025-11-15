import { 
  PlaylistItem, 
  ContentDetails, 
  ContentType, 
  TextContent, 
  ImageContent,
  ClockContent,
  DisplayInfo,
  AnimationContentDetails
} from '../types';

/**
 * Base URL for all API endpoints
 */
const API_BASE_URL = '/api';

type TextDetails = { type: 'Text' } & TextContent;
type ImageDetails = { type: 'Image' } & ImageContent;
type ClockDetails = { type: 'Clock' } & ClockContent;
type AnimationDetails = { type: 'Animation' } & AnimationContentDetails;

const isTextContent = (details: ContentDetails): details is TextDetails => details.type === ContentType.Text;
const isImageContent = (details: ContentDetails): details is ImageDetails => details.type === ContentType.Image;
const isClockContent = (details: ContentDetails): details is ClockDetails => details.type === ContentType.Clock;
const isAnimationContent = (details: ContentDetails): details is AnimationDetails => details.type === ContentType.Animation;

function normalizeTimingForContent(item: Partial<PlaylistItem>) {
  const details = item.content?.data;
  if (!details) return;

  if (isTextContent(details)) {
    if (details.scroll) {
      delete item.duration;
    } else {
      delete item.repeat_count;
    }
  } else if (isImageContent(details)) {
    const hasAnimation = !!details.animation && (details.animation.keyframes?.length ?? 0) >= 2;
    if (hasAnimation) {
      delete item.duration;
    } else {
      delete item.repeat_count;
    }
  } else if (isClockContent(details)) {
    delete item.repeat_count;
  } else if (isAnimationContent(details)) {
    delete item.repeat_count;
  }
}

// Playlist items endpoints

/**
 * Fetches all playlist items
 * @returns Promise containing array of playlist items
 */
export async function fetchPlaylistItems(): Promise<PlaylistItem[]> {
  console.log(`${API_BASE_URL}/playlist/items`, 'GET');
  try {
    const response = await fetch(`${API_BASE_URL}/playlist/items`);
    if (!response.ok) {
      const error = `HTTP error ${response.status}`;
      console.log(error);
      throw new Error(error);
    }
    const data = await response.json();
    console.log(`${API_BASE_URL}/playlist/items`, response.status, data);
    return data;
  } catch (error) {
    console.log(`Error in fetchPlaylistItems: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Creates a new playlist item
 * @param item - The partial playlist item data
 * @returns Promise containing the created playlist item with generated ID
 */
export async function createPlaylistItem(item: Partial<PlaylistItem>): Promise<PlaylistItem> {
  // Clone the item to avoid modifying the original
  const itemToSend = { ...item };
  normalizeTimingForContent(itemToSend);
  
  const response = await fetch('/api/playlist/items', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(itemToSend),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create item: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Fetches a specific playlist item by ID
 * @param id - The ID of the playlist item to fetch
 * @returns Promise containing the requested playlist item
 */
export async function fetchPlaylistItem(id: string): Promise<PlaylistItem> {
  console.log(`${API_BASE_URL}/playlist/items/${id}`, 'GET');
  try {
    const response = await fetch(`${API_BASE_URL}/playlist/items/${id}`);
    if (!response.ok) {
      const error = `HTTP error ${response.status}`;
      console.log(error);
      throw new Error(error);
    }
    const data = await response.json();
    console.log(`${API_BASE_URL}/playlist/items/${id}`, response.status, data);
    return data;
  } catch (error) {
    console.log(`Error in fetchPlaylistItem: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Updates an existing playlist item
 * @param id - The ID of the playlist item to update
 * @param item - The partial playlist item data to update
 * @returns Promise containing the updated playlist item
 */
export async function updatePlaylistItem(id: string, item: Partial<PlaylistItem>): Promise<PlaylistItem> {
  // Clone the item to avoid modifying the original
  const itemToSend = { 
    ...item,
    id: id 
  };
  normalizeTimingForContent(itemToSend);
  
  const response = await fetch(`/api/playlist/items/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(itemToSend),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update item: ${response.statusText} - ${errorText}`);
  }
  
  return response.json();
}

/**
 * Removes a playlist item
 * @param id - The ID of the playlist item to remove
 */
export async function removePlaylistItem(id: string): Promise<void> {
  console.log(`${API_BASE_URL}/playlist/items/${id}`, 'DELETE');
  try {
    const response = await fetch(`${API_BASE_URL}/playlist/items/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      const error = `HTTP error ${response.status}`;
      console.log(error);
      throw new Error(error);
    }
    console.log(`${API_BASE_URL}/playlist/items/${id}`, response.status, {});
  } catch (error) {
    console.log(`Error in removePlaylistItem: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Updates the order of playlist items
 * @param itemIds - Array of item IDs in the desired order
 * @returns Promise containing array of reordered playlist items
 */
export async function updatePlaylistOrder(itemIds: string[]): Promise<PlaylistItem[]> {
  const payload = { item_ids: itemIds };
  
  console.log(`${API_BASE_URL}/playlist/reorder`, 'PUT', payload);
  
  try {
    const response = await fetch(`${API_BASE_URL}/playlist/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const error = `HTTP error ${response.status}`;
      console.log(error);
      throw new Error(error);
    }
    const data = await response.json();
    console.log(`${API_BASE_URL}/playlist/reorder`, response.status, data);
    return data;
  } catch (error) {
    console.log(`Error in updatePlaylistOrder: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Fetches the current brightness setting
 * @returns Promise containing the brightness value (0-100)
 */
export async function fetchBrightness(): Promise<{ brightness: number }> {
  console.log(`${API_BASE_URL}/settings/brightness`, 'GET');
  try {
    const response = await fetch(`${API_BASE_URL}/settings/brightness`);
    if (!response.ok) {
      const error = `HTTP error ${response.status}`;
      console.log(error);
      throw new Error(error);
    }
    const data = await response.json();
    console.log(`${API_BASE_URL}/settings/brightness`, response.status, data);
    return data;
  } catch (error) {
    console.log(`Error in fetchBrightness: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Updates the brightness setting
 * @param value - Brightness value (0-100)
 * @returns Promise containing the updated brightness settings
 */
export async function updateBrightness(value: number): Promise<{ brightness: number }> {
  // Clamp brightness to integer between 0-100
  const brightnessValue = Math.max(0, Math.min(100, Math.round(Number(value))));
  
  const payload = JSON.stringify({ brightness: brightnessValue });
  console.debug(`Sending brightness update payload: ${payload}`);
  
  try {
    console.log(`${API_BASE_URL}/settings/brightness`, 'PUT', { brightness: brightnessValue });
    
    const response = await fetch(`${API_BASE_URL}/settings/brightness`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: payload
    });
    
    if (!response.ok) {
      try {
        const errorData = await response.text();
        const error = `HTTP error ${response.status}: ${errorData}`;
        console.log(error);
        throw new Error(error);
      } catch {
        const error = `HTTP error ${response.status}`;
        console.log(error);
        throw new Error(error);
      }
    }
    
    const data = await response.json();
    console.log(`${API_BASE_URL}/settings/brightness`, response.status, data);
    console.log(`Brightness updated to ${brightnessValue}%`);
    return data;
  } catch (error) {
    console.log(`Error in updateBrightness: ${error instanceof Error ? error.message : String(error)}`);
    console.log(`Stack trace: ${error instanceof Error ? error.stack : 'No stack trace'}`);
    throw error;
  }
}

/**
 * Simplified brightness update function with minimal error handling
 * @param value - Brightness value (0-100)
 */
export async function updateBrightnessSimple(value: number): Promise<void> {
  const brightnessValue = Math.max(0, Math.min(100, Math.round(Number(value))));
  
  try {
    const response = await fetch(`${API_BASE_URL}/settings/brightness`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brightness: brightnessValue })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    console.log(`Brightness updated to ${brightnessValue}%`);
  } catch (error) {
    console.log(`Error in updateBrightnessSimple: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Preview mode response type
 */
interface PreviewResponse {
  item: PlaylistItem;
  session_id: string;
}

export interface ImageUploadResponse {
  image_id: string;
  width: number;
  height: number;
  thumbnail_width: number;
  thumbnail_height: number;
}

export async function uploadImage(file: File): Promise<ImageUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/images`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload image: ${response.status} ${errorText}`);
  }

  return response.json();
}

export function getImageUrl(imageId: string): string {
  return `${API_BASE_URL}/images/${imageId}`;
}

export function getImageThumbnailUrl(imageId: string): string {
  return `${API_BASE_URL}/images/${imageId}/thumbnail`;
}

export async function fetchDisplayInfo(): Promise<DisplayInfo> {
  const response = await fetch(`${API_BASE_URL}/display/info`);
  if (!response.ok) {
    throw new Error(`Failed to fetch display info: ${response.status}`);
  }
  return response.json();
}

/**
 * Starts preview mode by displaying the provided content item on the LED matrix
 * @param item - The playlist item data to preview
 * @returns Promise containing the preview response with the item and session ID
 */
export async function startPreviewMode(item: Partial<PlaylistItem>): Promise<PreviewResponse> {
  // Clone the item to avoid modifying the original
  const itemToSend = { ...item };
  normalizeTimingForContent(itemToSend);
  
  const payload = {
    item: itemToSend
  };
  
  const response = await fetch('/api/preview', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    throw new Error('Failed to start preview mode');
  }
  
  return response.json();
}

/**
 * Updates the content in preview mode
 * @param item - The playlist item data to preview
 * @param sessionId - The session ID returned when preview mode was started
 * @returns Promise containing the updated preview response
 */
export async function updatePreviewContent(item: Partial<PlaylistItem>, sessionId: string): Promise<PreviewResponse> {
  // Clone the item to avoid modifying the original
  const itemToSend = { ...item };
  normalizeTimingForContent(itemToSend);
  
  const payload = {
    item: itemToSend,
    session_id: sessionId
  };
  
  const response = await fetch('/api/preview', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const status = response.status;
    if (status === 403) {
      throw new Error('Session does not own the preview lock');
    } else if (status === 404) {
      throw new Error('Not in preview mode');
    } else {
      throw new Error(`Failed to update preview: ${response.statusText}`);
    }
  }
  
  return response.json();
}

/**
 * Exits preview mode and returns to normal playlist playback
 * @param sessionId - The session ID returned when preview mode was started
 */
export async function exitPreviewMode(sessionId: string): Promise<void> {
  const response = await fetch('/api/preview', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ session_id: sessionId }),
  });
  
  if (!response.ok) {
    const status = response.status;
    if (status === 403) {
      throw new Error('Session does not own the preview lock');
    } else if (status === 404) {
      throw new Error('Not in preview mode');
    } else {
      throw new Error(`Failed to exit preview mode: ${response.statusText}`);
    }
  }
}

/**
 * Pings preview mode to keep the session alive
 * @param sessionId - The session ID returned when preview mode was started
 */
export async function pingPreviewMode(sessionId: string): Promise<void> {
  const response = await fetch('/api/preview/ping', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ session_id: sessionId }),
  });
  
  if (!response.ok) {
    const status = response.status;
    if (status === 403) {
      console.warn('Session does not own the preview lock');
    } else if (status === 404) {
      console.warn('Not in preview mode');
    } else {
      console.warn(`Failed to ping preview mode: ${response.statusText}`);
    }
  }
}

/**
 * Checks if the current session owns the preview lock
 * @param sessionId - The session ID to check
 * @returns Promise containing ownership status
 */
export async function checkPreviewSessionOwnership(sessionId: string): Promise<{ is_owner: boolean }> {
  const response = await fetch('/api/preview/session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ session_id: sessionId }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to check session ownership');
  }
  
  return response.json();
}

/**
 * Checks if a preview is currently active
 * @returns Promise containing the preview status
 */
export async function checkPreviewStatus(): Promise<{ active: boolean }> {
  const response = await fetch(`${API_BASE_URL}/preview/status`);
  
  if (!response.ok) {
    throw new Error('Failed to check preview status');
  }
  
  return response.json();
}

/**
 * Creates an EventSource connection to listen for editor lock events
 * @param onLockChange - Callback function that receives the lock status
 * @returns Cleanup function to close the connection
 */
export function subscribeToEditorLockEvents(
  onLockChange: (lockData: { locked: boolean; locked_by?: string }) => void,
  onError?: (error: Event) => void
): () => void {
  const eventSource = new EventSource('/api/events/editor');
  
  // Handle incoming messages
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onLockChange(data);
    } catch (error) {
      console.error('Error parsing editor lock event data:', error);
    }
  };
  
  // Handle connection errors
  eventSource.onerror = (error) => {
    console.error('EventSource connection error:', error);
    if (onError) {
      onError(error);
    }
    // The browser will attempt to reconnect automatically
  };
  
  // Return a cleanup function
  return () => {
    eventSource.close();
  };
}

/**
 * Creates an EventSource connection to listen for playlist update events
 * @param onPlaylistUpdate - Callback function that receives playlist updates
 * @returns Cleanup function to close the connection
 */
export function subscribeToPlaylistEvents(
  onPlaylistUpdate: (data: { items: PlaylistItem[], action: 'Add' | 'Update' | 'Delete' | 'Reorder' }) => void,
  onError?: (error: Event) => void
): () => void {
  const eventSource = new EventSource('/api/events/playlist');
  
  // Handle incoming messages
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onPlaylistUpdate(data);
    } catch (error) {
      console.error('Error parsing playlist event data:', error);
    }
  };
  
  // Handle connection errors
  eventSource.onerror = (error) => {
    console.error('EventSource connection error:', error);
    if (onError) {
      onError(error);
    }
    // The browser will attempt to reconnect automatically
  };
  
  // Return a cleanup function
  return () => {
    eventSource.close();
  };
}

/**
 * Type definitions for global methods
 */
declare global {
  interface Window {
    testItemUpdate?: (id: string) => Promise<void>;
    debugPlaylist?: () => Promise<void>;
  }
}
