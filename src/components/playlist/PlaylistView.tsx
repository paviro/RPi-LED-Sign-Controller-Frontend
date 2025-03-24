'use client';

import { useState, useEffect } from 'react';
import { 
  fetchPlaylistItems, 
  removePlaylistItem, 
  updatePlaylistOrder, 
  fetchBrightness, 
  updateBrightnessSimple 
} from '../../lib/api';
import PlaylistItem from './PlaylistItem';
import BrightnessControl from './controls/BrightnessControl';
import StatusMessage from '../common/StatusMessage';
import { PlaylistItem as PlaylistItemType } from '../../types';

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
        setBrightness(brightnessData.brightness);
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
  
  // Main component render - displays playlist items, add button, and brightness control
  return (
    <div className="space-y-3">
      {/* Title Bar */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
            <span className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mr-3 text-indigo-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
            </span>
            Playlist Items
          </h2>
          <button 
            onClick={onAddNewItem}
            className="flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add New Item
          </button>
        </div>
      </section>
      
      {/* Playlist Items - Using Container with Same Width as Sections */}
      <div className="py-2">
        {loading ? (
          <div className="flex items-center justify-center py-16 bg-white/30 dark:bg-gray-800/30 rounded-xl mx-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : playlistItems.length === 0 ? (
          <section className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
            <div className="empty-playlist-message py-10 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-center bg-white/30 dark:bg-gray-800/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-gray-600 dark:text-gray-300 mb-6">Your playlist is empty. Add some items to display on the LED sign.</p>
            </div>
          </section>
        ) : (
          <div className="space-y-4">
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
        )}
      </div>
      
      {/* Settings Container with Single Full-Width Card */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-5 flex items-center">
          <span className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mr-3 text-indigo-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </span>
          Settings
        </h2>
        
        {/* Full-width card for settings */}
        <div className="w-full p-4 border border-gray-100 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:shadow-md transition-shadow">
          <BrightnessControl 
            brightness={brightness} 
            onChange={handleBrightnessChange} 
          />
        </div>
      </section>
      
      {/* Status messages */}
      {status && <StatusMessage status={status} onClose={() => setStatus(null)} />}
    </div>
  );
} 