import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getTrades } from '@/lib/services/individualTradeService';
import { TradesList } from '@/components/TradesList';
import DailyLossAlert from '@/components/alerts/DailyLossAlert';
import { TradesPageQuote } from '@/components/quotes/TradesPageQuote';

export const metadata = {
  title: 'My Trades | WekangTradingJournal',
  description: 'View and manage all your trades',
};

export default async function TradesPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Read active account from cookie for server-side initial trade fetch
  const cookieStore = await cookies();
  const activeAccountId = cookieStore.get('active_account_id')?.value;

  // Fetch initial trades for active account
  const { trades } = await getTrades({
    userId: session.user.id,
    tradingAccountId: activeAccountId,
    page: 1,
    pageSize: 50,
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">📊 My Trades</h1>
            <p className="text-gray-600">View and manage all your trading history</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/trades/new" className="flex-1 sm:flex-initial">
              <Button size="lg" className="min-h-[44px] w-full sm:w-auto">
                ➕ New Trade
              </Button>
            </Link>
            <Link href="/trades/bulk" className="flex-1 sm:flex-initial">
              <Button size="lg" variant="outline" className="min-h-[44px] w-full sm:w-auto">
                📋 Bulk Entry
              </Button>
            </Link>
            <Link href="/trades/import" className="flex-1 sm:flex-initial">
              <Button size="lg" variant="outline" className="min-h-[44px] w-full sm:w-auto">
                📁 Import CSV
              </Button>
            </Link>
          </div>
        </div>

        {/* Contextual Quote - Pinned at Top */}
        <TradesPageQuote />

        {/* Daily Loss Alert */}
        <DailyLossAlert className="mb-6" />

        <TradesList initialTrades={trades} userId={session.user.id} />
      </div>
    </div>
  );
}
