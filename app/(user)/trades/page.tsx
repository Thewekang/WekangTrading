import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getTrades } from '@/lib/services/individualTradeService';
import { TradesList } from '@/components/TradesList';

export const metadata = {
  title: 'My Trades | WekangTradingJournal',
  description: 'View and manage all your trades',
};

export default async function TradesPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Fetch initial trades for current user
  const { trades } = await getTrades({
    userId: session.user.id,
    page: 1,
    pageSize: 50,
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">📊 My Trades</h1>
            <p className="text-gray-600">View and manage all your trading history</p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-3">
            <Link href="/trades/new">
              <Button size="lg" className="min-h-[44px]">
                ➕ New Trade
              </Button>
            </Link>
            <Link href="/trades/bulk">
              <Button size="lg" variant="outline" className="min-h-[44px]">
                📋 Bulk Entry
              </Button>
            </Link>
          </div>
        </div>

        <TradesList initialTrades={trades} userId={session.user.id} />
      </div>
    </div>
  );
}
