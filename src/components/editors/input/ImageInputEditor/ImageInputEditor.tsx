'use client';

import { useState, useEffect } from 'react';

interface ImageInputEditorProps {
  itemId: string | null;
  updateStatus: (status: { message: string; type: "error" | "success" | "info" } | null) => void;
  updateSaving: (saving: boolean) => void;
  updateLoading: (loading: boolean) => void;
  onBack?: () => void;
}

export default function ImageInputEditor({ 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  itemId,
  updateStatus,
  updateSaving,
  updateLoading,
  onBack 
}: ImageInputEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);
  const [visible, setVisible] = useState(false);
  
  // Simulate loading for consistency with TextInputEditor
  useEffect(() => {
    // We could actually use updateLoading here to inform the parent about loading state
    updateLoading(true);
    
    const loadingTimeout = setTimeout(() => {
      setIsLoaded(true);
      updateLoading(false); // Update parent when done loading
      
      // Fade in the editor after a short delay
      setTimeout(() => {
        setVisible(true);
      }, 50);
    }, 100);
    
    // Show loading indicator if loading takes more than 500ms
    const indicatorTimeout = setTimeout(() => {
      if (!isLoaded) {
        setShowLoadingIndicator(true);
      }
    }, 500);
    
    return () => {
      clearTimeout(loadingTimeout);
      clearTimeout(indicatorTimeout);
    };
  }, [isLoaded, updateLoading]);
  
  // Update parent component saving state
  useEffect(() => {
    updateSaving(isSaving);
  }, [isSaving, updateSaving]);
  
  // Listen for save event from parent
  useEffect(() => {
    const handleSave = async () => {
      setIsSaving(true);
      // Simulate API call
      setTimeout(() => {
        updateStatus({ message: "Feature coming soon! This is just a placeholder.", type: "info" });
        setIsSaving(false);
        
        // Navigate back after the mock save
        if (onBack) {
          setTimeout(onBack, 1500); // Add a delay so user can see the message
        }
      }, 1000);
    };

    document.addEventListener('editor-save', handleSave);
    return () => {
      document.removeEventListener('editor-save', handleSave);
    };
  }, [updateStatus, onBack]);

  // If we're still loading and the indicator should be shown
  if (!isLoaded && showLoadingIndicator) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-2"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading editor content...</p>
        </div>
      </div>
    );
  }

  // If we're still loading but not showing the indicator yet, render an empty space
  if (!isLoaded) {
    return <div className="h-40"></div>;
  }

  return (
    <div 
      className={`space-y-6 transition-opacity duration-300 ease-in-out ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-8 text-center">
        <div className="mb-4 inline-block p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-2">
          Coming Soon
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Image support is coming soon! You&apos;ll soon be able to upload and configure images for your displays.
        </p>
      </div>
      
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h4 className="font-medium text-lg text-gray-800 dark:text-gray-200 mb-4">
          Features to expect:
        </h4>
        <ul className="space-y-2 text-gray-600 dark:text-gray-400">
          <li className="flex items-center">
            <span className="mr-2 text-green-500">✓</span>
            Crop your image
          </li>
          <li className="flex items-center">
            <span className="mr-2 text-green-500">✓</span>
            Size and position adjustments
          </li>
          <li className="flex items-center">
            <span className="mr-2 text-green-500">✓</span>
            Add movement keyframes to animate the image
          </li>
        </ul>
      </div>
    </div>
  );
} 