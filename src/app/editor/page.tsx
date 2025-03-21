'use client'; // Marks this as a client component that executes in the browser

import { Suspense } from 'react';
import EditorLoader from '../../components/EditorLoader';

/**
 * EditorPage component that serves as the main container for the editor functionality
 * Uses Suspense for improved loading experience
 */
export default function EditorPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <Suspense fallback={
        // Displays a loading message while EditorLoader is being loaded
        <div className="text-center py-12">Loading editor...</div>
      }>
        {/* EditorLoader handles the actual editor implementation */}
        <EditorLoader />
      </Suspense>
    </main>
  );
} 