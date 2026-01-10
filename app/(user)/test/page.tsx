/**
 * Test Helper Page
 * Quick access to test error handling and UX features
 * 
 * Access at: http://localhost:3000/test
 * 
 * ⚠️ Remove this file before production deployment!
 */

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function TestPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl">🧪</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Testing Dashboard
              </h1>
              <p className="text-gray-600">
                Quick access to test error handling and UX features
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800 font-medium">
              ⚠️ <strong>Warning:</strong> This page is for testing only. Remove before production deployment!
            </p>
          </div>
        </div>

        {/* Test Sections */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Loading States */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>🔄</span> Loading States
            </h2>
            <div className="space-y-3">
              <Link href="/dashboard" className="block">
                <Button className="w-full" variant="outline">
                  Test Dashboard Loading
                </Button>
              </Link>
              <Link href="/trades" className="block">
                <Button className="w-full" variant="outline">
                  Test Trades Loading
                </Button>
              </Link>
              <Link href="/targets" className="block">
                <Button className="w-full" variant="outline">
                  Test Targets Loading
                </Button>
              </Link>
              <Link href="/analytics/trends" className="block">
                <Button className="w-full" variant="outline">
                  Test Trends Loading
                </Button>
              </Link>
            </div>
          </div>

          {/* Empty States */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>📭</span> Empty States
            </h2>
            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-2">
                To test empty states, you need to:
              </div>
              <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                <li>Delete all trades to see dashboard empty state</li>
                <li>Apply filters that return no results</li>
                <li>Create new user with no data</li>
              </ul>
              <Link href="/trades" className="block mt-4">
                <Button className="w-full" variant="outline">
                  View Trades Page
                </Button>
              </Link>
            </div>
          </div>

          {/* Error Handling */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>⚠️</span> Error Handling
            </h2>
            <div className="space-y-3">
              <Link href="/this-does-not-exist" className="block">
                <Button className="w-full" variant="outline">
                  Test 404 Page
                </Button>
              </Link>
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                <strong>To test error boundary:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Import TestError component</li>
                  <li>Add to any page</li>
                  <li>Click "Throw Error" button</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Form Validation */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>✍️</span> Form Validation
            </h2>
            <div className="space-y-3">
              <Link href="/trades/new" className="block">
                <Button className="w-full" variant="outline">
                  Test Trade Entry Form
                </Button>
              </Link>
              <Link href="/trades/bulk" className="block">
                <Button className="w-full" variant="outline">
                  Test Bulk Entry Form
                </Button>
              </Link>
              <Link href="/targets" className="block">
                <Button className="w-full" variant="outline">
                  Test Target Form
                </Button>
              </Link>
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                Try submitting with invalid data to see validation errors
              </div>
            </div>
          </div>

          {/* API Testing */}
          <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>🌐</span> API Error Handling
            </h2>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="bg-blue-50 p-4 rounded">
                <h3 className="font-semibold mb-2">Validation Error (400)</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Submit form with future timestamp or zero profit/loss
                </p>
                <Link href="/trades/new">
                  <Button size="sm" variant="outline" className="w-full">
                    Go to Form
                  </Button>
                </Link>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <h3 className="font-semibold mb-2">Unauthorized (401)</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Logout and try accessing protected route
                </p>
                <Link href="/api/auth/signout">
                  <Button size="sm" variant="outline" className="w-full">
                    Logout
                  </Button>
                </Link>
              </div>
              <div className="bg-purple-50 p-4 rounded">
                <h3 className="font-semibold mb-2">Not Found (404)</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Try accessing invalid trade ID
                </p>
                <Link href="/trades/invalid-id-12345">
                  <Button size="sm" variant="outline" className="w-full">
                    Test 404
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Documentation */}
          <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>📚</span> Testing Documentation
            </h2>
            <div className="prose prose-sm max-w-none">
              <p>
                For comprehensive testing instructions, see <code>TESTING-CHECKLIST.md</code>
              </p>
              <div className="bg-gray-50 p-4 rounded mt-4">
                <h3 className="font-semibold mb-2">Quick Test Steps:</h3>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Open browser DevTools (F12)</li>
                  <li>Check Console for errors</li>
                  <li>Check Network tab for failed requests</li>
                  <li>Test on mobile view (DevTools → Device Toolbar)</li>
                  <li>Test loading states by throttling network</li>
                  <li>Test empty states with new user or no data</li>
                  <li>Test error boundaries with TestError component</li>
                  <li>Test form validation with invalid inputs</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Link href="/dashboard">
            <Button size="lg" variant="outline">
              ← Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
