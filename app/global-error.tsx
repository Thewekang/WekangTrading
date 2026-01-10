'use client';

import { useEffect } from 'react';

/**
 * Global Error Handler
 * Catches errors in the root layout
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-red-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center border-2 border-red-200">
            <div className="text-6xl mb-4">🚨</div>
            <h1 className="text-2xl font-bold text-red-900 mb-2">
              Critical Error
            </h1>
            <p className="text-red-700 mb-6">
              A critical error occurred. Please refresh the page or contact support if the problem persists.
            </p>

            {process.env.NODE_ENV === 'development' && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-red-500 hover:text-red-700 mb-2">
                  Error Details (Dev Only)
                </summary>
                <pre className="text-xs bg-red-100 p-4 rounded overflow-auto max-h-48 text-red-800">
                  {error.message}
                  {'\n\n'}
                  {error.stack}
                  {error.digest && `\n\nDigest: ${error.digest}`}
                </pre>
              </details>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={reset}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                🔄 Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                🏠 Go Home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
