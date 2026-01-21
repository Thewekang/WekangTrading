import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { RealTimeTradeEntryForm } from '@/components/forms/RealTimeTradeEntryForm';
import DailyLossAlert from '@/components/alerts/DailyLossAlert';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const metadata = {
  title: 'New Trade | WekangTradingJournal',
  description: 'Record a new trade in real-time',
};

export default async function NewTradePage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Get user's preferred timezone
  const user = await db.select({ preferredTimezone: users.preferredTimezone })
    .from(users)
    .where(eq(users.id, session.user.id))
    .get();
  
  const userTimezone = user?.preferredTimezone || 'Asia/Kuala_Lumpur';

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Daily Loss Alert */}
        <DailyLossAlert className="mb-6" />

        {/* Timezone Reminder */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌍</span>
            <p className="text-sm text-amber-900">
              <strong>Timezone:</strong> All timestamps are in <strong>{userTimezone}</strong> timezone.
              {userTimezone !== 'UTC' && <span className="text-amber-700 ml-1">(Stored in UTC)</span>}
              <a href="/settings" className="ml-2 text-amber-700 hover:text-amber-900 underline font-medium">
                Change timezone
              </a>
            </p>
          </div>
        </div>
        
        <RealTimeTradeEntryForm />
        
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Quick Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Trade time auto-fills with current time</li>
            <li>• Market session calculated automatically from timestamp</li>
            <li>• Large buttons optimized for mobile use during trading</li>
            <li>• Form resets after submission for quick next entry</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
