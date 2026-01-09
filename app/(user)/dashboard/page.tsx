import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getPersonalStats, getDailyTrends } from '@/lib/services/statsService';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Fetch real stats directly from service (server-side)
  const stats = await getPersonalStats(session.user.id, 'month');

  // Fallback to zeros if no data yet
  const totalTrades = stats.totalTrades;
  const winRate = stats.winRate;
  const sopRate = stats.sopRate;
  const netProfitLoss = stats.totalProfitLossUsd;
  const bestSession = stats.bestSession;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {session.user.name}! 🏍️💰
          </h1>
          <p className="text-muted-foreground">
            Track your trading performance and analyze your results
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="p-6 bg-white rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Trades</h3>
            <p className="text-3xl font-bold">{totalTrades}</p>
            <p className="text-sm text-muted-foreground mt-2">This month</p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Win Rate</h3>
            <p className={`text-3xl font-bold ${winRate >= 60 ? 'text-green-600' : winRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
              {winRate.toFixed(1)}%
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {stats.totalWins} wins / {stats.totalLosses} losses
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-600 mb-2">SOP Compliance</h3>
            <p className={`text-3xl font-bold ${sopRate >= 80 ? 'text-green-600' : sopRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
              {sopRate.toFixed(1)}%
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {stats.totalSopFollowed} / {totalTrades} trades
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Net P/L</h3>
            <p className={`text-3xl font-bold ${netProfitLoss > 0 ? 'text-green-600' : netProfitLoss < 0 ? 'text-red-600' : ''}`}>
              ${Math.abs(netProfitLoss).toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">This month</p>
          </div>
        </div>

        {/* Best Session Insight */}
        {bestSession && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">🎯 Best Trading Session</h2>
            <p className="text-blue-800">
              Your highest win rate this month is during the <span className="font-semibold">{bestSession}</span> session. 
              Consider focusing more trades in this time period.
            </p>
          </div>
        )}

        {/* No Data State */}
        {totalTrades === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Ready to Start Trading?</h2>
            <p className="text-gray-700 mb-4">
              You haven't logged any trades yet. Get started by:
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• <a href="/trades/new" className="text-blue-600 hover:underline">Real-time entry</a> - Log trades as they happen (mobile-optimized)</li>
              <li>• <a href="/trades/bulk" className="text-blue-600 hover:underline">Bulk entry</a> - Enter multiple trades at end of day</li>
              <li>• <a href="/trades" className="text-blue-600 hover:underline">View all trades</a> - See your complete trading history</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
