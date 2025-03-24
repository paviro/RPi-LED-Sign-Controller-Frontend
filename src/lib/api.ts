import { Playlist, PlaylistItem } from '../types';

/**
 * Base URL for all API endpoints
 */
const API_BASE_URL = '/api';

/**
 * Updates an entire playlist
 * @param playlist - The playlist data to update
 */
export async function updatePlaylist(playlist: Playlist): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/playlist`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(playlist),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update playlist');
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
  // Don't set an ID for new items - let the server generate one
  
  console.log(`${API_BASE_URL}/playlist/items`, 'POST', item as unknown as Record<string, unknown>);
  
  try {
    const response = await fetch(`${API_BASE_URL}/playlist/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      const error = `HTTP error ${response.status}: ${errorData}`;
      console.log(error);
      throw new Error(error);
    }
    
    const data = await response.json();
    console.log(`${API_BASE_URL}/playlist/items`, response.status, data);
    return data;
  } catch (error) {
    console.log(`Error in createPlaylistItem: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
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
  console.log(`${API_BASE_URL}/playlist/items/${id}`, 'PUT', item as unknown as Record<string, unknown>);
  
  try {
    const response = await fetch(`${API_BASE_URL}/playlist/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...item,
        id // Include the ID in the request payload
      })
    });
    
    if (!response.ok) {
      const error = `HTTP error ${response.status}`;
      console.log(error);
      throw new Error(error);
    }
    
    const data = await response.json();
    console.log(`${API_BASE_URL}/playlist/items/${id}`, response.status, data);
    
    return data;
  } catch (error) {
    console.log(`Error in updatePlaylistItem: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
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
 */
export async function updatePlaylistOrder(itemIds: string[]): Promise<void> {
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
    console.log(`${API_BASE_URL}/playlist/reorder`, response.status, {});
  } catch (error) {
    console.log(`Error in updatePlaylistOrder: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Fetches the current brightness setting
 * @returns Promise containing the brightness value (0-100)
 */
export async function fetchBrightness(): Promise<{ value: number }> {
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
    return { value: data.brightness };
  } catch (error) {
    console.log(`Error in fetchBrightness: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Updates the brightness setting
 * @param value - Brightness value (0-100)
 */
export async function updateBrightness(value: number): Promise<void> {
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
 * Test function for playlist item updates
 * @param id - The ID of the playlist item to update
 */
export async function testUpdateItem(id: string): Promise<void> {
  try {
    // Get the item by ID
    const item = await fetchPlaylistItem(id);
    console.log('Original item:', item);
    
    // Modify the item properties
    item.text = "Updated text message!";
    item.color = [0, 0, 255];
    item.speed = 40.0;
    
    // Add colored segments
    item.colored_segments = [
      {
        start: 0,
        end: 7,
        text: "Updated",
        color: [255, 0, 0]
      },
      {
        start: 8,
        end: 15,
        text: "message",
        color: [0, 255, 0]
      }
    ];
    
    // Set border effect
    item.border_effect = { "Rainbow": null };
    
    console.log('Modified item:', item);
    
    // Send the update to the server
    const updateResponse = await fetch(`${API_BASE_URL}/playlist/items/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(item)
    });
    
    const responseText = await updateResponse.text();
    console.log('Direct update response:', responseText);
    
    if (!updateResponse.ok) {
      throw new Error(`Failed to update item: ${updateResponse.status} ${updateResponse.statusText}`);
    }
    
    console.log('Item updated successfully using direct approach!');
    
  } catch (error) {
    console.error('Test update error:', error);
  }
}

/**
 * Starts preview mode by displaying the provided content item on the LED matrix
 * @param item - The playlist item data to preview
 */
export async function startPreviewMode(item: Partial<PlaylistItem>): Promise<void> {
  console.log(`${API_BASE_URL}/preview`, 'POST', item as unknown as Record<string, unknown>);
  
  try {
    const response = await fetch(`${API_BASE_URL}/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    
    if (!response.ok) {
      const error = `HTTP error ${response.status}`;
      console.log(error);
      throw new Error(error);
    }
    
    console.log(`${API_BASE_URL}/preview`, response.status, {});
  } catch (error) {
    console.log(`Error in startPreviewMode: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Exits preview mode and returns to normal playlist playback
 */
export async function exitPreviewMode(): Promise<void> {
  console.log(`${API_BASE_URL}/preview`, 'DELETE');
  
  try {
    const response = await fetch(`${API_BASE_URL}/preview`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = `HTTP error ${response.status}`;
      console.log(error);
      throw new Error(error);
    }
    
    console.log(`${API_BASE_URL}/preview`, response.status, {});
  } catch (error) {
    console.log(`Error in exitPreviewMode: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Checks if the display is currently in preview mode
 * @returns Promise containing the preview mode status
 */
export async function checkPreviewModeStatus(): Promise<{ active: boolean }> {
  console.log(`${API_BASE_URL}/preview/status`, 'GET');
  
  try {
    const response = await fetch(`${API_BASE_URL}/preview/status`);
    
    if (!response.ok) {
      const error = `HTTP error ${response.status}`;
      console.log(error);
      throw new Error(error);
    }
    
    const data = await response.json();
    console.log(`${API_BASE_URL}/preview/status`, response.status, data);
    return data;
  } catch (error) {
    console.log(`Error in checkPreviewModeStatus: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
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

// Add this function to your existing API functions
export const pingPreviewMode = async (): Promise<void> => {
  try {
    const response = await fetch('/api/preview/ping', {
      method: 'POST',
    });
    
    if (!response.ok) {
      console.warn('Preview mode ping failed:', response.status);
    }
  } catch (error) {
    console.error('Error pinging preview mode:', error);
  }
};
