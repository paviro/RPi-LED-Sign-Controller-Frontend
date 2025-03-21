import React, { useState, useEffect } from 'react';
import { PlaylistItem as PlaylistItemType } from '../types';

interface PlaylistItemProps {
  item: PlaylistItemType;
  index: number;
  onEdit: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export default function PlaylistItem({ 
  item, 
  onEdit, 
  onRemove, 
  onMoveUp, 
  onMoveDown,
  isFirst,
  isLast
}: PlaylistItemProps) {
  // State for controlling visibility of mobile action buttons
  const [showMobileActions, setShowMobileActions] = useState(false);
  
  // State to track if screen is mobile-sized for responsive behavior
  const [, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 640);
  
  // Effect hook to handle closing mobile actions when clicking outside the action area
  useEffect(() => {
    const handleOutsideClick = () => {
      if (showMobileActions) {
        setShowMobileActions(false);
      }
    };
    
    // Add document click listener only when mobile actions are shown
    if (showMobileActions) {
      document.addEventListener('click', handleOutsideClick);
    }
    
    // Clean up event listener on component unmount or when showMobileActions changes
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [showMobileActions]);
  
  // Track window resize to update mobile state
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Generate display text based on playlist item configuration (scroll vs static)
  const getItemDetails = () => {
    if (item.scroll) {
      return `Scrolling · ${item.speed} px/s · ${item.repeat_count} repeats`;
    } else {
      return `Static · ${item.duration} seconds`;
    }
  };
  
  // Convert content type to title case for display
  const getContentTypeLabel = () => {
    return item.content_type.charAt(0).toUpperCase() + item.content_type.slice(1);
  };

  // Toggle mobile actions menu with stopPropagation to prevent document click handler from firing
  const toggleMobileActions = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMobileActions(!showMobileActions);
  };

  // Handle edit action and close mobile menu
  const handleEdit = () => {
    setShowMobileActions(false);
    onEdit();
  };

  return (
    <div 
      className="playlist-item bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-xl shadow-md cursor-pointer border border-gray-200 dark:border-gray-700 group relative overflow-hidden flex items-center"
      onClick={handleEdit}
    >
      
      {/* Content type badge (text, image, etc.) */}
      <div className="item-type shrink-0">
        <span className="type-label bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded-full text-xs font-medium">
          {getContentTypeLabel()}
        </span>
      </div>
      
      {/* Visual separator between type badge and content */}
      <div className="item-divider mx-2 h-8 w-px bg-gray-200 dark:bg-gray-700 shrink-0"></div>
      
      {/* Main content area */}
      <div className="flex-grow flex flex-col w-[calc(100%-48px)]">
        {/* Item title/text */}
        <div className="font-medium text-gray-800 dark:text-gray-200 truncate">
          {item.text}
        </div>
        
        {/* Item details for mobile view */}
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 md:hidden truncate">
          {getItemDetails()}
        </div>
      </div>
      
      {/* Item details for desktop view */}
      <div className="text-sm text-gray-500 dark:text-gray-400 hidden md:block shrink-0 w-auto mr-10">
        {getItemDetails()}
      </div>
      
      {/* Mobile action controls */}
      <div className="sm:hidden absolute right-0 top-0 h-full">
        {/* Toggle button for mobile actions menu */}
        <button 
          className={`h-full px-3 bg-gray-100 dark:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 transition-all z-20 relative ${showMobileActions ? 'opacity-0' : 'opacity-100'}`}
          onClick={toggleMobileActions}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
        
        {/* Expandable mobile action buttons */}
        <div 
          className={`absolute top-0 right-0 flex h-full bg-white dark:bg-gray-800 shadow-md border-l border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out ${showMobileActions ? 'translate-x-0' : 'translate-x-full'} z-10`}
          onClick={e => e.stopPropagation()}
        >
          {/* Move up button - disabled when item is at the top */}
          <button 
            className={`flex items-center justify-center w-14 h-full border-r border-gray-200 dark:border-gray-700 active:bg-gray-100 dark:active:bg-gray-700 ${isFirst ? 'opacity-50 bg-gray-50 dark:bg-gray-750' : 'bg-white dark:bg-gray-800'}`}
            disabled={isFirst}
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          {/* Move down button - disabled when item is at the bottom */}
          <button 
            className={`flex items-center justify-center w-14 h-full border-r border-gray-200 dark:border-gray-700 active:bg-gray-100 dark:active:bg-gray-700 ${isLast ? 'opacity-50 bg-gray-50 dark:bg-gray-750' : 'bg-white dark:bg-gray-800'}`}
            disabled={isLast}
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {/* Remove item button */}
          <button 
            className="flex items-center justify-center w-14 h-full bg-white dark:bg-gray-800 active:bg-red-50 dark:active:bg-red-900/20 text-red-500"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {/* Close mobile actions menu */}
          <button 
            className="flex items-center justify-center w-14 h-full border-l border-gray-200 dark:border-gray-700 active:bg-gray-100 dark:active:bg-gray-700"
            onClick={toggleMobileActions}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Desktop action buttons - shown on hover */}
      <div 
        className="hidden sm:flex h-full absolute right-0 top-0 opacity-70 group-hover:opacity-100 transition-opacity" 
        onClick={e => e.stopPropagation()}
      >
        {/* Desktop move up button */}
        <button 
          className={`flex items-center justify-center w-12 h-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isFirst ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isFirst}
          onClick={onMoveUp}
          title="Move Up"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        {/* Desktop move down button */}
        <button 
          className={`flex items-center justify-center w-12 h-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isLast ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isLast}
          onClick={onMoveDown}
          title="Move Down"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {/* Desktop delete button */}
        <button 
          className="flex items-center justify-center w-12 h-full hover:bg-red-100 dark:hover:bg-red-900 text-red-500 transition-colors"
          onClick={onRemove}
          title="Delete"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
} 