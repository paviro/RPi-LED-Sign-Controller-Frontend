import { useState, useEffect } from 'react';
import { StatusMessageProps } from '../../types';

/**
 * StatusMessage component displays temporary notifications with different styling based on type (error, success, info).
 * The message automatically dismisses after 5 seconds or can be manually closed.
 */
export default function StatusMessage({ status, onClose }: StatusMessageProps) {
  const [visible, setVisible] = useState(true);
  // Tracks when the message is in the process of being removed to trigger fade-out animation
  const [leaving, setLeaving] = useState(false);
  
  // Auto-dismiss the message after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setLeaving(true);
      
      // Wait for fade-out animation (300ms) before removing from DOM
      setTimeout(() => {
        setVisible(false);
        onClose();
      }, 300);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [status, onClose]);
  
  // Determine CSS classes based on message type
  const getStyles = () => {
    const baseClasses = `fixed bottom-4 left-1/2 transform -translate-x-1/2 px-5 py-4 rounded-lg shadow-lg max-w-md w-full flex justify-between items-center transition-all duration-300 ${leaving ? 'opacity-0 translate-y-2' : 'opacity-100'}`;
    
    switch (status.type) {
      case 'error':
        return `${baseClasses} bg-red-50 text-red-800 border-l-4 border-red-500`;
      case 'success':
        return `${baseClasses} bg-green-50 text-green-800 border-l-4 border-green-500`;
      case 'info':
        return `${baseClasses} bg-blue-50 text-blue-800 border-l-4 border-blue-500`;
      default:
        return `${baseClasses} bg-gray-50 text-gray-800 border-l-4 border-gray-500`;
    }
  };
  
  // Return appropriate SVG icon based on message type
  const getIcon = () => {
    switch (status.type) {
      case 'error':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'success':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'info':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };
  
  // Don't render anything if message isn't visible
  if (!visible) return null;
  
  return (
    <div className={getStyles()}>
      <div className="flex items-center">
        {getIcon()}
        <span className="text-sm md:text-base">{status.message}</span>
      </div>
      {/* Close button with same animation behavior as auto-dismiss */}
      <button 
        onClick={() => {
          setLeaving(true);
          setTimeout(() => {
            setVisible(false);
            onClose();
          }, 300);
        }}
        className="ml-3 p-1.5 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0"
        aria-label="Close notification"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
} 