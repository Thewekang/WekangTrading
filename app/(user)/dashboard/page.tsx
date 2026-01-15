import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getPersonalStats, getDailyTrends, getSessionStats, getHourlyStats } from '@/lib/services/statsService';
import { getActiveTargetsWithProgress } from '@/lib/services/targetService';
import { getBestSopType } from '@/lib/services/sopTypeService';
import SessionComparisonChart from '@/components/charts/SessionComparisonChart';
import HourlyHeatmap from '@/components/charts/HourlyHeatmap';
import TargetProgressCard from '@/components/dashboard/TargetProgressCard';
import { BestSopCard } from '@/components/dashboard/BestSopCard';
import { NoTradesEmptyState } from '@/components/ui/empty-state';
import DailyLossAlert from '@/components/alerts/DailyLossAlert';
import TodayEconomicNews from '@/components/calendar/TodayEconomicNews';
import WeeklyEconomicNews from '@/components/calendar/WeeklyEconomicNews';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Fetch real stats and targets
  const [stats, sessionStats, hourlyStats, activeTargets, bestSop] = await Promise.all([
    getPersonalStats(session.user.id, 'month'),
    getSessionStats(session.user.id, 'month'),
    getHourlyStats(session.user.id, 'month'),
    getActiveTargetsWithProgress(session.user.id),
    getBestSopType(session.user.id, 'month'),
  ]);

  // Fallback to zeros if no data yet
  const totalTrades = stats.totalTrades;
  const winRate = stats.winRate;
  const sopRate = stats.sopRate;
  const netProfitLoss = stats.totalProfitLossUsd;
  const bestSession = stats.bestSession;

  // Show empty state if no trades
  if (totalTrades === 0) {
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
          <NoTradesEmptyState />
        </div>
      </div>
    );
  }

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

        {/* Daily Loss Alert */}
        <DailyLossAlert className="mb-6" />

        {/* Economic News Widgets */}
        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          <TodayEconomicNews />
          <WeeklyEconomicNews />
        </div>

        {/* Stats Cards and Best SOP */}
        <div className="grid gap-6 lg:grid-cols-3 mb-6">
          {/* Stats Cards - 2 columns on large screens */}
          <div className="lg:col-span-2 grid gap-6 md:grid-cols-2">
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

          {/* Best SOP Card - 1 column on large screens */}
          <div className="lg:col-span-1">
            <BestSopCard data={bestSop} period="month" />
          </div>
        </div>

        {/* Active Targets Progress */}
        {activeTargets.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">🎯 Active Targets</h2>
              <Link
                href="/targets"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeTargets.map((target) => (
                <TargetProgressCard key={target.id} target={target} />
              ))}
            </div>
          </div>
        )}

        {/* No Targets Callout */}
        {activeTargets.length === 0 && totalTrades > 0 && (
          <div className="mb-8">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="text-4xl">🎯</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Set Your Trading Goals
                  </h3>
                  <p className="text-sm text-blue-700 mb-4">
                    Create targets to track your progress towards specific win rate, SOP compliance, and profit goals. 
                    Get AI-powered suggestions based on your recent performance!
                  </p>
                  <Link
                    href="/targets"
                    className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Your First Target →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Legend */}
        {totalTrades > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
            <div className="flex flex-wrap items-center gap-6">
              <span className="text-sm font-medium text-gray-700">Performance Guide:</span>
              
              {/* Win Rate Legend */}
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-600">Win Rate:</span>
                <div className="flex items-center gap-1">
                  <span className="text-green-600 font-semibold text-xs">●</span>
                  <span className="text-xs text-gray-600">≥60%</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-600 font-semibold text-xs">●</span>
                  <span className="text-xs text-gray-600">50-59%</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-red-600 font-semibold text-xs">●</span>
                  <span className="text-xs text-gray-600">&lt;50%</span>
                </div>
              </div>

              {/* SOP Compliance Legend */}
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-600">SOP:</span>
                <div className="flex items-center gap-1">
                  <span className="text-green-600 font-semibold text-xs">●</span>
                  <span className="text-xs text-gray-600">≥80%</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-600 font-semibold text-xs">●</span>
                  <span className="text-xs text-gray-600">60-79%</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-red-600 font-semibold text-xs">●</span>
                  <span className="text-xs text-gray-600">&lt;60%</span>
                </div>
              </div>

              {/* P/L Legend */}
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-600">P/L:</span>
                <div className="flex items-center gap-1">
                  <span className="text-green-600 font-semibold text-xs">●</span>
                  <span className="text-xs text-gray-600">Profit</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-red-600 font-semibold text-xs">●</span>
                  <span className="text-xs text-gray-600">Loss</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Best Session Insight */}
        {bestSession && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">🎯 Best Trading Session</h2>
            <p className="text-blue-800 mb-4">
              Your highest win rate this month is during the <span className="font-semibold">{bestSession}</span> session 
              with a <span className="font-semibold">{stats.bestSessionWinRate.toFixed(1)}%</span> win rate. 
              Consider focusing more trades in this time period.
            </p>
            
            {/* Session Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              {Object.entries(stats.sessionBreakdown).map(([session, data]) => (
                <div 
                  key={session} 
                  className={`p-3 rounded-lg border-2 ${
                    session === bestSession 
                      ? 'bg-blue-100 border-blue-300' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="text-xs font-medium text-gray-600 mb-1">{session}</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {data.winRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {data.wins}/{data.trades} trades
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Session Breakdown (when no clear best) */}
        {!bestSession && totalTrades > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">📊 Session Performance</h2>
            <p className="text-gray-700 mb-4">
              Need at least 3 trades in a session to identify your best trading time.
            </p>
            
            {/* Session Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(stats.sessionBreakdown).map(([session, data]) => {
                const sessionLabels: Record<string, string> = {
                  ASIA: 'ASIA',
                  EUROPE: 'EUROPE',
                  US: 'US',
                  ASIA_EUROPE_OVERLAP: 'ASIA-EUR',
                  EUROPE_US_OVERLAP: 'EUR-US',
                };
                return (
                  <div key={session} className="p-3 bg-white rounded-lg border border-gray-200">
                    <div className="text-xs font-medium text-gray-600 mb-1">
                      {sessionLabels[session] || session}
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {data.trades > 0 ? `${data.winRate.toFixed(1)}%` : 'No data'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {data.wins}/{data.trades} trades
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Session Performance Chart */}
        {totalTrades > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">📈 Session Win Rate Comparison</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Visual breakdown of your performance across different trading sessions
                </p>
              </div>
              <Link
                href="/analytics/trends"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View Trends →
              </Link>
            </div>
            <SessionComparisonChart data={sessionStats} bestSession={bestSession} />
          </div>
        )}

        {/* Hourly Performance Heatmap */}
        {totalTrades > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">🕐 Hourly Performance Heatmap</h2>
            <p className="text-sm text-gray-600 mb-4">
              Identify your most profitable trading hours by time of day
            </p>
            <HourlyHeatmap 
              data={hourlyStats} 
              userId={session.user.id}
              period="month"
            />
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
