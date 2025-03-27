'use client';

import React from 'react';

interface EditorUnavailableProps {
  onBack: () => void;
}

/**
 * Displays a message when the editor is unavailable because
 * another user is currently using the preview mode
 */
export default function EditorUnavailable({ onBack }: EditorUnavailableProps) {
  return (
    <div className="space-y-5">
      {/* Title Bar - Keeping consistent with other screens */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
            <span className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mr-3 text-indigo-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </span>
            Editor Unavailable
          </h2>
          <button 
            onClick={onBack}
            className="flex items-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            ← Back to Playlist
          </button>
        </div>
      </section>
      
      {/* Content Area */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col items-center text-center p-6">
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-2">
            The editor is currently in use
          </h3>
          
          <div className="text-gray-600 dark:text-gray-400 max-w-md mb-5">
            <p>The LED Panel can only show one preview at a time.</p>
            <p>You'll be redirected when the editor becomes available.</p>
          </div>
          
          {/* Improved progress bar with smoother animation */}
          <div className="w-full max-w-md bg-gray-100 dark:bg-gray-700/50 rounded-full h-2.5 mb-8 overflow-hidden">
            <div className="stripe-loader rounded-full h-full"></div>
          </div>
          
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Waiting for editor to become available...
          </p>
        </div>
      </section>
      
      {/* CSS for the improved animation */}
      <style jsx>{`
        .stripe-loader {
          position: relative;
          background-color: rgba(79, 70, 229, 0.7);
          width: 100%;
        }
        
        .stripe-loader::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: linear-gradient(
            -45deg,
            rgba(255, 255, 255, 0.2) 25%,
            transparent 25%,
            transparent 50%,
            rgba(255, 255, 255, 0.2) 50%,
            rgba(255, 255, 255, 0.2) 75%,
            transparent 75%,
            transparent
          );
          background-size: 16px 16px;
          z-index: 1;
          animation: stripe-animation 1s linear infinite;
          border-radius: inherit;
        }
        
        @keyframes stripe-animation {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 16px 0;
          }
        }
      `}</style>
    </div>
  );
} 