import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BulkTradeEntryForm } from '@/components/forms/BulkTradeEntryForm';

export const metadata = {
  title: 'Bulk Trade Entry | WekangTradingJournal',
  description: 'Enter multiple trades at once for end-of-day recording',
};

export default async function BulkTradePage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">📋 Bulk Trade Entry</h1>
            <p className="text-gray-600">Enter multiple trades at once for efficient end-of-day recording</p>
          </div>
          <Link href="/trades">
            <Button variant="outline">← Back to Trades</Button>
          </Link>
        </div>

        <BulkTradeEntryForm />
      </div>
    </div>
  );
}
