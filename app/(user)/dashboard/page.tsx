import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { getPersonalStats, getSymbolStats } from '@/lib/services/statsService';
import { getActiveTargetsWithProgress } from '@/lib/services/targetService';
import { getBestSopType } from '@/lib/services/sopTypeService';
import ChartSkeleton from '@/components/charts/ChartSkeleton';
import TargetProgressCard from '@/components/dashboard/TargetProgressCard';

// Dynamic imports for economic news (lazy loading)
const TodayEconomicNews = dynamic(() => import('@/components/calendar/TodayEconomicNews'), {
  loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-48" />
});

const WeeklyEconomicNews = dynamic(() => import('@/components/calendar/WeeklyEconomicNews'), {
  loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-48" />
});

import { BestSopCard } from '@/components/dashboard/BestSopCard';
import { SymbolStatsCard } from '@/components/dashboard/SymbolStatsCard';
import { NoTradesEmptyState } from '@/components/ui/empty-state';
import DailyLossAlert from '@/components/alerts/DailyLossAlert';
import { CollapsibleAchievementsSection } from '@/components/dashboard/CollapsibleAchievementsSection';
import { CollapsibleChartSection } from '@/components/dashboard/CollapsibleChartSection';
import { SessionComparisonChartWrapper } from '@/components/charts/SessionComparisonChartWrapper';
import { HourlyHeatmapWrapper } from '@/components/charts/HourlyHeatmapWrapper';
import { RankingCard } from '@/components/dashboard/RankingCard';
import { QuoteOfTheDayWidget } from '@/components/quotes/QuoteOfTheDayWidget';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Fetch only critical stats for initial page load
  // sessionStats and hourlyStats will be fetched client-side on demand (in collapsible sections)
  const [stats, activeTargets, bestSop, symbolStats] = await Promise.all([
    getPersonalStats(session.user.id, 'all'),
    getActiveTargetsWithProgress(session.user.id),
    getBestSopType(session.user.id, 'all'),
    getSymbolStats(session.user.id, 'all'),
  ]);

  // Fallback to zeros if no data yet
  const totalTrades = stats.totalTrades;
  const winRate = stats.winRate;
  const sopRate = stats.sopRate;
  const netProfitLoss = stats.netProfitLossUsd ?? stats.totalProfitLossUsd;
  const grossProfitLoss = stats.totalProfitLossUsd;
  const totalCommission = stats.totalCommissionUsd ?? 0;
  const bestSession = stats.bestSession;

  // Show empty state if no trades
  if (totalTrades === 0) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              <span className="flex items-center gap-2">
                Welcome back, {session.user.name}!
                <Image src="/logo.png" alt="Wekang Trading" width={24} height={24} className="object-contain inline-block" priority />
              </span>
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
        {/* Enhanced Hero Section with Logo */}
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-blue-100">
          <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6">
            <div className="flex-shrink-0">
              <Image 
                src="/logo.png" 
                alt="Wekang Trading" 
                width={64}
                height={64}
                className="sm:w-[80px] sm:h-[80px] md:w-[96px] md:h-[96px] object-contain drop-shadow-md" 
                priority
              />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 text-slate-900">
                Welcome back, {session.user.name}!
              </h1>
              <p className="text-slate-600 text-sm sm:text-base md:text-lg">
                Track your trading performance and analyze your results
              </p>
            </div>
          </div>
        </div>

        {/* Daily Loss Alert */}
        <DailyLossAlert className="mb-6" />

        {/* Quote of the Day Widget */}
        <div className="mb-6">
          <QuoteOfTheDayWidget />
        </div>

        {/* Collapsible Achievements Section */}
        <CollapsibleAchievementsSection />

        {/* Economic News Widgets */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 mb-6">
          <TodayEconomicNews />
          <WeeklyEconomicNews />
        </div>

        {/* User Ranking Card */}
        <div className="mb-6">
          <RankingCard />
        </div>

        {/* Stats Cards and Best SOP */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3 mb-6">
          {/* Stats Cards - 2 columns on large screens */}
          <div className="lg:col-span-2 grid gap-4 sm:gap-6 grid-cols-2">
            <div className="p-3 sm:p-4 md:p-6 bg-white rounded-lg shadow border">
              <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Total Trades</h3>
              <p className="text-2xl sm:text-3xl font-bold">{totalTrades}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">All time</p>
            </div>

            <div className="p-3 sm:p-4 md:p-6 bg-white rounded-lg shadow border">
              <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Win Rate</h3>
              <p className={`text-2xl sm:text-3xl font-bold ${winRate >= 60 ? 'text-green-600' : winRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                {winRate.toFixed(1)}%
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
                {stats.totalWins}W / {stats.totalLosses}L
              </p>
            </div>

            <div className="p-3 sm:p-4 md:p-6 bg-white rounded-lg shadow border">
              <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">SOP Compliance</h3>
              <p className={`text-2xl sm:text-3xl font-bold ${sopRate >= 80 ? 'text-green-600' : sopRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                {sopRate.toFixed(1)}%
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
                {stats.totalSopFollowed} / {totalTrades}
              </p>
            </div>

            <div className="p-3 sm:p-4 md:p-6 bg-white rounded-lg shadow border">
              <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Net P/L</h3>
              <p className={`text-2xl sm:text-3xl font-bold ${netProfitLoss > 0 ? 'text-green-600' : netProfitLoss < 0 ? 'text-red-600' : ''}`}>
                {netProfitLoss >= 0 ? '+' : '-'}${Math.abs(netProfitLoss).toFixed(2)}
              </p>
              {totalCommission !== 0 && (
                <div className="mt-1 sm:mt-2 space-y-0.5 text-xs text-muted-foreground">
                  <div>Gross: <span className={grossProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>{grossProfitLoss >= 0 ? '+' : ''}${grossProfitLoss.toFixed(2)}</span></div>
                  <div>Commission: <span className="text-red-500">${totalCommission.toFixed(2)}</span></div>
                </div>
              )}
              {totalCommission === 0 && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">All time</p>
              )}
            </div>
          </div>

          {/* Best SOP Card - 1 column on large screens */}
          <div className="lg:col-span-1">
            <BestSopCard data={bestSop} period="all" />
          </div>
        </div>

        {/* Symbol Performance Analytics */}
        {symbolStats.all.length > 0 && (
          <div className="mb-6">
            <SymbolStatsCard data={symbolStats} />
          </div>
        )}

        {/* Active Targets Progress */}
        {activeTargets.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">🎯 Active Targets</h2>
              <Link
                href="/targets"
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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

        {/* Performance Legend - Compact */}
        {totalTrades > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 sm:p-3 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 text-xs">
              <span className="font-medium text-gray-700">Legend:</span>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <span className="text-green-600">● ≥60% Win</span>
                <span className="text-yellow-600">● 50-59%</span>
                <span className="text-red-600">● &lt;50%</span>
              </div>
              <div className="hidden sm:block h-3 w-px bg-gray-300" />
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <span className="text-green-600">● ≥80% SOP</span>
                <span className="text-yellow-600">● 60-79%</span>
                <span className="text-red-600">● &lt;60%</span>
              </div>
            </div>
          </div>
        )}

        {/* Best Session Insight - Collapsible */}
        {bestSession && (
          <CollapsibleChartSection
            title="Best Trading Session"
            description={`Your highest win rate overall is during the ${bestSession} session with ${stats.bestSessionWinRate.toFixed(1)}% win rate`}
            icon="🎯"
            defaultOpen={false}
          >
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-blue-800 mb-4">
                Consider focusing more trades during the <span className="font-semibold">{bestSession}</span> session 
                for optimal performance.
              </p>
              
              {/* Session Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
          </CollapsibleChartSection>
        )}

        {/* Session Breakdown (when no clear best) - Collapsible */}
        {!bestSession && totalTrades > 0 && (
          <CollapsibleChartSection
            title="Session Performance"
            description="Need at least 3 trades in a session to identify your best trading time"
            icon="📊"
            defaultOpen={false}
          >
            <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
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
          </CollapsibleChartSection>
        )}

        {/* Session Performance Chart - Collapsible */}
        {totalTrades > 0 && (
          <CollapsibleChartSection
            title="Session Win Rate Comparison"
            description="Visual breakdown of your performance across different trading sessions"
            icon="📈"
            linkHref="/analytics/trends"
            linkText="View Trends →"
            defaultOpen={false}
          >
            <div className="mt-4">
              <SessionComparisonChartWrapper userId={session.user.id} bestSession={bestSession} />
            </div>
          </CollapsibleChartSection>
        )}

        {/* Hourly Performance Heatmap - Collapsible */}
        {totalTrades > 0 && (
          <CollapsibleChartSection
            title="Hourly Performance Heatmap"
            description="Identify your most profitable trading hours by time of day"
            icon="🕐"
            defaultOpen={false}
          >
            <div className="mt-4">
              <HourlyHeatmapWrapper userId={session.user.id} />
            </div>
          </CollapsibleChartSection>
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
