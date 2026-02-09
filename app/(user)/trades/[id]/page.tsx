import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';
import { individualTrades, sopTypes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { DeleteTradeButton } from '@/components/trades/DeleteTradeButton';

export default async function TradeDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Fetch trade with SOP type
  const trade = await db
    .select({
      id: individualTrades.id,
      userId: individualTrades.userId,
      tradeTimestamp: individualTrades.tradeTimestamp,
      result: individualTrades.result,
      sopFollowed: individualTrades.sopFollowed,
      sopTypeId: individualTrades.sopTypeId,
      symbol: individualTrades.symbol,
      profitLossUsd: individualTrades.profitLossUsd,
      marketSession: individualTrades.marketSession,
      notes: individualTrades.notes,
      createdAt: individualTrades.createdAt,
      sopType: sopTypes,
    })
    .from(individualTrades)
    .leftJoin(sopTypes, eq(individualTrades.sopTypeId, sopTypes.id))
    .where(eq(individualTrades.id, params.id))
    .get();

  if (!trade) {
    notFound();
  }

  // Check if user owns this trade (or is admin)
  if (trade.userId !== session.user.id && session.user.role !== 'ADMIN') {
    redirect('/trades');
  }

  // Calculate hours since creation
  const hoursSinceCreation = (Date.now() - new Date(trade.createdAt).getTime()) / (1000 * 60 * 60);
  const canDelete = hoursSinceCreation <= 24;

  // Format session badge
  const sessionBadges: Record<string, string> = {
    ASIA: '🌏 Asia',
    EUROPE: '🇪🇺 Europe',
    US: '🇺🇸 US',
    ASIA_EUROPE_OVERLAP: '🔄 Asia-Europe',
    EUROPE_US_OVERLAP: '🔄 Europe-US',
  };

  return (
    <div className="container mx-auto py-6 sm:py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/trades">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Trades
            </Button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Trade Details</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            View detailed information about this trade
          </p>
        </div>

        {/* Trade Detail Card */}
        <div className="bg-white rounded-lg shadow-md border p-4 sm:p-6 space-y-6">
          {/* Trade Result Banner */}
          <div className={`rounded-lg p-4 sm:p-6 text-center ${
            trade.result === 'WIN' 
              ? 'bg-green-50 border-2 border-green-200' 
              : 'bg-red-50 border-2 border-red-200'
          }`}>
            <div className="text-4xl sm:text-5xl mb-3">
              {trade.result === 'WIN' ? '✅' : '❌'}
            </div>
            <div className={`text-2xl sm:text-3xl font-bold mb-2 ${
              trade.result === 'WIN' ? 'text-green-700' : 'text-red-700'
            }`}>
              {trade.result}
            </div>
            <div className={`text-3xl sm:text-4xl font-bold ${
              trade.profitLossUsd > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {trade.profitLossUsd > 0 ? '+' : ''}${trade.profitLossUsd.toFixed(2)}
            </div>
          </div>

          {/* Trade Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Timestamp */}
            <div>
              <div className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Trade Timestamp</div>
              <div className="text-base sm:text-lg font-semibold text-gray-900">
                {new Date(trade.tradeTimestamp).toLocaleString()}
              </div>
            </div>

            {/* Market Session */}
            <div>
              <div className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Market Session</div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {sessionBadges[trade.marketSession] || trade.marketSession}
              </span>
            </div>

            {/* Symbol */}
            <div>
              <div className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Symbol</div>
              <div className="text-base sm:text-lg font-mono font-semibold text-gray-900">
                {trade.symbol || '—'}
              </div>
            </div>

            {/* SOP Followed */}
            <div>
              <div className="text-xs sm:text-sm font-medium text-gray-500 mb-1">SOP Followed</div>
              <div className="text-base sm:text-lg font-semibold">
                {trade.sopFollowed ? (
                  <span className="text-blue-600">✓ Yes</span>
                ) : (
                  <span className="text-orange-600">✗ No</span>
                )}
              </div>
            </div>

            {/* SOP Type */}
            {trade.sopType && (
              <div className="sm:col-span-2">
                <div className="text-xs sm:text-sm font-medium text-gray-500 mb-1">SOP Type</div>
                <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-purple-100 text-purple-800">
                  {trade.sopType.name}
                </span>
              </div>
            )}
          </div>

          {/* Notes Section */}
          {trade.notes && (
            <div>
              <div className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Notes</div>
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border">
                <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap">{trade.notes}</p>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="border-t pt-4">
            <div className="text-xs text-gray-500">
              Created: {new Date(trade.createdAt).toLocaleString()}
            </div>
            {canDelete && (
              <div className="mt-2 flex items-center gap-2 text-xs text-amber-600">
                🕒 This trade can be deleted (within 24-hour window)
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            {canDelete ? (
              <>
                <Link href="/trades" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Back to List
                  </Button>
                </Link>
                <div className="flex-1">
                  <DeleteTradeButton tradeId={trade.id} />
                </div>
              </>
            ) : (
              <Link href="/trades" className="w-full">
                <Button variant="outline" className="w-full">
                  Back to List
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
