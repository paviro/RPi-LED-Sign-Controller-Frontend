'use client';

import {ReactNode } from 'react';
import StatusMessage from '../common/StatusMessage';

interface BaseEditorProps {
  title: string;
  isNewItem: boolean;
  onBack: () => void;
  onSave: () => void;
  isLoading: boolean;
  isSaving: boolean;
  status: { message: string; type: "error" | "success" | "info" } | null;
  onStatusClose: () => void;
  children: ReactNode;
}

export default function BaseEditor({
  title,
  isNewItem,
  onBack,
  onSave,
  isLoading,
  isSaving,
  status,
  onStatusClose,
  children
}: BaseEditorProps) {
  if (isLoading) {
    return (
      <div className="text-center py-12">Loading editor...</div>
    );
  }
  
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