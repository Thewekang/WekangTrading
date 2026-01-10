/**
 * Test Error Component
 * Use this to test error boundaries
 * 
 * Instructions:
 * 1. Import this component into any page (e.g., dashboard/page.tsx)
 * 2. Add <TestError /> to the JSX
 * 3. See the error boundary catch it
 * 4. Remove after testing
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function TestError() {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new Error('🧪 Test Error: This is intentional to test the error boundary!');
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-red-100 border-2 border-red-500 rounded-lg p-4 shadow-lg">
      <h4 className="font-bold text-red-900 mb-2">🧪 Test Error Boundary</h4>
      <p className="text-sm text-red-700 mb-3">Click to trigger an error:</p>
      <Button
        onClick={() => setShouldError(true)}
        variant="destructive"
        size="sm"
      >
        Throw Error
      </Button>
    </div>
  );
}

/**
 * Test API Error Component
 * Tests API error handling
 */
export function TestApiError() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testInvalidData = async () => {
    setLoading(true);
    setResult('');
    try {
      const response = await fetch('/api/trades/individual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tradeTimestamp: new Date(Date.now() + 86400000).toISOString(), // Tomorrow (invalid)
          result: 'WIN',
          sopFollowed: true,
          profitLossUsd: 0, // Invalid (cannot be 0)
        }),
      });
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult('Network error: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const testNotFound = async () => {
    setLoading(true);
    setResult('');
    try {
      const response = await fetch('/api/trades/individual/invalid-id-123');
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult('Network error: ' + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-yellow-100 border-2 border-yellow-500 rounded-lg p-4 shadow-lg max-w-md">
      <h4 className="font-bold text-yellow-900 mb-2">🧪 Test API Errors</h4>
      <div className="flex flex-col gap-2 mb-3">
        <Button onClick={testInvalidData} disabled={loading} size="sm" variant="outline">
          Test Validation Error
        </Button>
        <Button onClick={testNotFound} disabled={loading} size="sm" variant="outline">
          Test 404 Error
        </Button>
      </div>
      {result && (
        <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-48 border">
          {result}
        </pre>
      )}
    </div>
  );
}
