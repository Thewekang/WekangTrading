import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminTestPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Test Page</h1>
        
        <div className="space-y-4">
          <div>
            <strong>Session Status:</strong>
            <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>

          {!session && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              ❌ Not logged in. Please <a href="/login" className="underline">login first</a>.
            </div>
          )}

          {session && session.user.role !== 'ADMIN' && (
            <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
              ⚠️ You are logged in as USER, not ADMIN. Current role: {session.user.role}
            </div>
          )}

          {session && session.user.role === 'ADMIN' && (
            <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              ✅ You are logged in as ADMIN. You should be able to access admin pages.
              <div className="mt-2">
                <a href="/admin/overview" className="underline">Go to Admin Overview</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
