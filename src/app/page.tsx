'use client';

import { useState, useRef } from 'react';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Use dynamic imports to prevent hydration issues
const PlaylistView = dynamic(() => import('../components/playlist/PlaylistView'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  )
});

// Update this import to use the new EditorFactory
const EditorFactory = dynamic(() => import('../components/editors/EditorFactory'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  )
});

export default function HomePage() {
  // Track which view is currently active (playlist or editor)
  const [currentView, setCurrentView] = useState<'playlist' | 'editor'>('playlist');
  
  // Store the ID of the item being edited, null when creating a new item
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  
  // Reference to know when we need to force clean up preview
  const exitPreviewRef = useRef<(() => void) | null>(null);
  
  // Helper function to switch to editor view, optionally with an item to edit
  const switchToEditor = (itemId?: string) => {
    setEditingItemId(itemId || null);
    setCurrentView('editor');
  };
  
  // Helper function to return to the playlist view
  const switchToPlaylist = () => {
    // First, call any cleanup function if it exists
    if (exitPreviewRef.current) {
      exitPreviewRef.current();
      exitPreviewRef.current = null;
    }
    
    // Then switch views
    setCurrentView('playlist');
    setEditingItemId(null);
  };
  
  // Register a preview cleanup function
  const registerExitPreview = (exitFn: () => void) => {
    exitPreviewRef.current = exitFn;
  };
  
  return (
    <main className="pb-0">
      {/* Header with app title and description */}
      <header className="mb-6 flex items-center border-b border-indigo-200 dark:border-indigo-900 pb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-indigo-600 dark:text-indigo-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <div>
          <h1 className="text-2xl font-medium text-gray-800 dark:text-white">RPi LED Sign Controller</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your LED display from the web</p>
        </div>
      </header>
      
      {/* Main content area with loading fallback */}
      <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>}>
        {currentView === 'playlist' ? (
          <PlaylistView onEditItem={switchToEditor} onAddNewItem={() => switchToEditor()} />
        ) : (
          <EditorFactory 
            itemId={editingItemId} 
            onBack={switchToPlaylist} 
            registerExitPreview={registerExitPreview}
          />
        )}
      </Suspense>
    </main>
  );
}
