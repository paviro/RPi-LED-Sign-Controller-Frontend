import './globals.css';
import type { Metadata } from 'next';

// Define metadata for the application which populates <head> tags
export const metadata: Metadata = {
  title: 'RPi LED Sign Controller',
  description: 'Control your LED sign display from the web',
};

// Root layout component that wraps all pages in the application
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-8 mb-0">
          {children}
        </div>
      </body>
    </html>
  );
}
