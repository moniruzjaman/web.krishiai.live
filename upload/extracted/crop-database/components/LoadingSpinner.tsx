import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white bg-opacity-90 rounded-xl shadow-lg mt-8 mx-auto max-w-sm">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-600"></div>
      <p className="mt-6 text-xl font-semibold text-gray-700">Loading crop data...</p>
      <p className="text-gray-500 text-sm mt-2">This may take a moment as Gemini AI generates insights.</p>
    </div>
  );
};

export default LoadingSpinner;