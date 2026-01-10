import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
          <div className="text-6xl mb-4">🏍️💨</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Page Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            Oops! The page you're looking for has taken a different route. Let's get you back on track.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/dashboard">
            <Button size="lg" className="w-full min-h-[44px]">
              🏠 Go to Dashboard
            </Button>
          </Link>
          <Link href="/trades">
            <Button variant="outline" size="lg" className="w-full min-h-[44px]">
              📊 View Trades
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="lg" className="w-full min-h-[44px]">
              ← Back to Home
            </Button>
          </Link>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            If you think this is a mistake, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}
