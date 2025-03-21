'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import EditorContent from './EditorContent';

/**
 * EditorLoader component
 * Responsible for extracting the item ID from URL parameters
 * and loading the appropriate content in the editor
 */
export default function EditorLoader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Extract the item ID from URL query parameters
  const itemId = searchParams.get('id');
  
  // Handle navigation back to the main page
  const handleBack = () => {
    router.push('/');
  };
  
  return (
    // Render the editor with the extracted item ID and navigation handler
    <EditorContent 
      itemId={itemId} 
      onBack={handleBack} 
    />
  );
} 