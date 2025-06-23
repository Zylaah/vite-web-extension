import React from 'react';
import MessageRenderer from './MessageRenderer';

interface ResponseDisplayProps {
  response: string;
  error: string | null;
  isLoading: boolean;
  isStreaming?: boolean;
}

const ResponseDisplay: React.FC<ResponseDisplayProps> = ({ response, error, isLoading, isStreaming = false }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        {isStreaming && (
          <div className="ml-3 text-blue-600 dark:text-blue-400">
            Streaming response...
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 text-red-700 dark:text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="text-gray-500 dark:text-gray-400 text-center p-8">
        <p>Ask a question about this page</p>
      </div>
    );
  }

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <MessageRenderer content={response} />
      {isStreaming && (
        <div className="mt-2 flex items-center text-sm text-blue-600 dark:text-blue-400">
          <div className="animate-pulse mr-2">●</div>
          Streaming...
        </div>
      )}
    </div>
  );
};

export default ResponseDisplay; 