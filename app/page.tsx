import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">
          🏍️💰 WekangTradingJournal
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Trading Performance Tracking System
        </p>
        
        <div className="flex gap-4 justify-center mb-8">
          <Link href="/login">
            <Button size="lg">Login</Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline">Sign Up</Button>
          </Link>
        </div>

        <div className="space-y-4">
          <div className="p-6 bg-white rounded-lg shadow-md border">
            <h2 className="text-2xl font-semibold mb-2">Phase 1: Authentication Complete ✅</h2>
            <p className="text-gray-600">
              Login, Registration & Protected Routes Ready
            </p>
          </div>
          <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Test Accounts:</h3>
            <ul className="text-left text-sm text-blue-800 space-y-1">
              <li>• Admin: admin@wekangtradingjournal.com / admin123</li>
              <li>• Trader: trader1@example.com / trader123</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
