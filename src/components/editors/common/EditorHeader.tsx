interface EditorHeaderProps {
  isNewItem: boolean;
  onBack: () => void;
  title?: string; // Optional custom title
}

export default function EditorHeader({ isNewItem, onBack, title }: EditorHeaderProps) {
  // Determine the displayed title
  const displayTitle = title || (isNewItem ? 'Add New Item' : 'Edit Item');

  return (
    <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
          <span className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mr-3 text-indigo-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </span>
          {displayTitle}
        </h2>
        <button 
          onClick={onBack}
          className="flex items-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          ← Back to Playlist
        </button>
      </div>
    </section>
  );
} 