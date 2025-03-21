'use client';

import { useState, useEffect } from 'react';
import { 
  fetchPlaylistItems, 
  removePlaylistItem, 
  updatePlaylistOrder, 
  fetchBrightness, 
  updateBrightnessSimple 
} from '../lib/api';
import PlaylistItem from './PlaylistItem';
import BrightnessControl from './BrightnessControl';
import StatusMessage from './StatusMessage';
import { PlaylistItem as PlaylistItemType } from '../types';

interface PlaylistViewProps {
  onEditItem: (itemId?: string) => void;
  onAddNewItem: () => void;
}

/**
 * PlaylistView component - Displays and manages the LED sign playlist items
 * Provides functionality for adding, removing, and reordering items
 * Also handles brightness control for the LED sign
 */
export default function PlaylistView({ onEditItem, onAddNewItem }: PlaylistViewProps) {
  const [playlistItems, setPlaylistItems] = useState<PlaylistItemType[]>([]);
  const [brightness, setBrightness] = useState(50);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ message: string; type: "error" | "success" | "info" } | null>(null);
  
  // Fetch playlist items and brightness settings from the API on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const items = await fetchPlaylistItems();
        
        setPlaylistItems(items);
        
        const brightnessData = await fetchBrightness();
        setBrightness(brightnessData.value);
      } catch (error) {
        setStatus({
          message: `Error loading data: ${error instanceof Error ? error.message : 'Unknown error'}`,
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Handle item removal - removes item from server and updates local state
  const handleRemoveItem = async (id: string) => {
    try {
      await removePlaylistItem(id);
      setPlaylistItems(items => items.filter(item => item.id !== id));
      setStatus({ message: 'Item removed successfully', type: 'success' });
    } catch (error) {
      setStatus({
        message: `Error removing item: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
    }
  };
  
  // Handle move up functionality - swaps item with the one above it
  const handleMoveUp = async (index: number) => {
    if (index <= 0) return;
    
    const newItems = [...playlistItems];
    const temp = newItems[index];
    newItems[index] = newItems[index - 1];
    newItems[index - 1] = temp;
    
    setPlaylistItems(newItems);
    
    // Update order on server
    const itemIds = newItems.map(item => item.id);
    try {
      await updatePlaylistOrder(itemIds);
    } catch (error) {
      setStatus({
        message: `Error updating order: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
      // Revert to original ordering if the server update fails
      setPlaylistItems(playlistItems);
    }
  };
  
  // Handle move down functionality - swaps item with the one below it
  const handleMoveDown = async (index: number) => {
    if (index >= playlistItems.length - 1) return;
    
    const newItems = [...playlistItems];
    const temp = newItems[index];
    newItems[index] = newItems[index + 1];
    newItems[index + 1] = temp;
    
    setPlaylistItems(newItems);
    
    // Update order on server
    const itemIds = newItems.map(item => item.id);
    try {
      await updatePlaylistOrder(itemIds);
    } catch (error) {
      setStatus({
        message: `Error updating order: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
      // Revert to original ordering if the server update fails
      setPlaylistItems(playlistItems);
    }
  };
  
  // Handle brightness change - updates local state and sends to server
  const handleBrightnessChange = async (value: number) => {
    setBrightness(value);
    try {
      await updateBrightnessSimple(value);
    } catch (error) {
      setStatus({
        message: `Error updating brightness: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
    }
  };
  
  // Render empty playlist message and brightness control when no items exist
  if (!loading && playlistItems.length === 0) {
    return (
      <div>
        <div className="empty-playlist-message bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-gray-600 dark:text-gray-300 mb-4">Your playlist is empty. Add some messages to display on the LED sign.</p>
          <div className="mt-6">
            <button 
              onClick={onAddNewItem}
              className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium flex items-center justify-center mx-auto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Item
            </button>
          </div>
        </div>
        <BrightnessControl 
          brightness={brightness} 
          onChange={handleBrightnessChange} 
        />
        {status && <StatusMessage status={status} onClose={() => setStatus(null)} />}
      </div>
    );
  }
  
  // Main component render - displays playlist items, add button, and brightness control
  return (
    <div>
      {loading ? (
        // Loading spinner display
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          <div className="playlist-items space-y-3 mb-8">
            {playlistItems.map((item, index) => (
              <PlaylistItem 
                key={item.id}
                item={item}
                index={index}
                onEdit={() => onEditItem(item.id)}
                onRemove={() => handleRemoveItem(item.id)}
                onMoveUp={() => handleMoveUp(index)}
                onMoveDown={() => handleMoveDown(index)}
                isFirst={index === 0}
                isLast={index === playlistItems.length - 1}
              />
            ))}
          </div>
          
          <div className="button-row mt-6 mb-8">
            <button 
              onClick={onAddNewItem}
              className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium flex items-center justify-center mx-auto w-full max-w-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Message
            </button>
          </div>
          
          <BrightnessControl 
            brightness={brightness} 
            onChange={handleBrightnessChange} 
          />
        </>
      )}
      
      {/* Status message displays success/error notifications */}
      {status && <StatusMessage status={status} onClose={() => setStatus(null)} />}
    </div>
  );
} 