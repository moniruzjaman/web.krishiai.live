import React from 'react';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div className="bg-red-50 border border-red-400 text-red-800 px-6 py-4 rounded-lg shadow-md relative mx-auto my-8 max-w-lg" role="alert">
      <strong className="font-bold text-lg">Oops!</strong>
      <span className="block sm:inline ml-3 text-base">{message}</span>
      <p className="text-sm mt-2 text-red-700">Please check your internet connection or try refreshing the page.</p>
    </div>
  );
};

export default ErrorMessage;