import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { RealTimeTradeEntryForm } from '@/components/forms/RealTimeTradeEntryForm';

export const metadata = {
  title: 'New Trade | WekangTradingJournal',
  description: 'Record a new trade in real-time',
};

export default async function NewTradePage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
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
