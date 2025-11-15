'use client';

import { ReactNode } from 'react';
import StatusMessage from '../../common/StatusMessage';
import { ContentType } from '../../../types';

interface EditorShellProps {
  title: string;
  isNewItem: boolean;
  onBack: () => void;
  contentType: ContentType;
  onContentTypeChange: (type: ContentType) => void;
  children: ReactNode;
  status: { message: string; type: "error" | "success" | "info" } | null;
  onStatusClose: () => void;
  isSaving: boolean;
  onSave: () => void;
}

/**
 * EditorShell provides a consistent shell for all editor types with title bar, 
 * content type selector, and action buttons - but delegates the actual
 * editor content to children.
 */
export default function EditorShell({
  title,
  isNewItem,
  onBack,
  contentType,
  onContentTypeChange,
  children,
  status,
  onStatusClose,
  isSaving,
  onSave
}: EditorShellProps) {
  // Available content types
  const contentTypes = [
    { id: ContentType.Text, label: 'Text Message', icon: 'message' },
    { id: ContentType.Image, label: 'Image', icon: 'image', disabled: false },
    { id: ContentType.Animation, label: 'Animation', icon: 'animation', disabled: false },
    { id: ContentType.Clock, label: 'Clock', icon: 'clock', disabled: false },
  ];
  
  return (
    <div className="space-y-5">
      {/* Title Bar */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
            <span className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mr-3 text-indigo-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </span>
            {isNewItem ? 'Add New Item' : `Edit ${title}`}
          </h2>
          <button 
            onClick={onBack}
            className="flex items-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            ← Back to Playlist
          </button>
        </div>
      </section>

      {/* Content Type Selector - Only show for new items */}
      {isNewItem && (
        <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4 flex items-center">
            <span className="p-1 bg-indigo-100 dark:bg-indigo-900/20 rounded mr-2 text-indigo-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </span>
            Content Type
          </h3>
          
          <div className="flex flex-wrap gap-3">
            {contentTypes.map((type) => (
              <button
                key={type.id}
                disabled={type.disabled}
                onClick={() => !type.disabled && onContentTypeChange(type.id)}
                className={`relative py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center border ${
                  contentType === type.id 
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 shadow-sm' 
                    : 'bg-gray-50 dark:bg-gray-900/30 hover:bg-gray-100 dark:hover:bg-gray-800/70 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                } ${type.disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {/* Content type icon */}
                <span className={`mr-2 ${
                  contentType === type.id 
                    ? 'text-indigo-600 dark:text-indigo-300' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {type.icon === 'message' && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                    </svg>
                  )}
                  {type.icon === 'image' && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  )}
                  {type.icon === 'animation' && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                    </svg>
                  )}
                  {type.icon === 'clock' && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  )}
                </span>
                <span className="font-medium">{type.label}</span>
                
                {type.disabled && (
                  <span className="ml-1.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
                    Soon
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Content Area */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">        
        {children}
        
        {status && (
          <StatusMessage
            status={status}
            onClose={onStatusClose}
          />
        )}
      </section>

      {/* Action Buttons */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
        <div className="flex space-x-3">
          <button
            onClick={onSave}
            disabled={isSaving}
            className={`px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md flex items-center ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Save
              </>
            )}
          </button>
          <button
            onClick={onBack}
            className="px-6 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors shadow-md"
          >
            Cancel
          </button>
        </div>
      </section>
    </div>
  );
} 