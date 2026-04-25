import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getAccount, getAccountRules } from '@/lib/services/tradingAccountService';
import { getCycleStatus } from '@/lib/services/accountRulesService';
import { getPersonalStats, getSymbolStats } from '@/lib/services/statsService';
import { getActiveTargetsWithProgress } from '@/lib/services/targetService';
import { getBestSopType } from '@/lib/services/sopTypeService';
import ChartSkeleton from '@/components/charts/ChartSkeleton';
import { DrawdownStatusCard } from '@/components/dashboard/DrawdownStatusCard';
import { CycleInsightsCard } from '@/components/dashboard/CycleInsightsCard';
import { CycleProfitTargetCard } from '@/components/dashboard/CycleProfitTargetCard';
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
import TargetProgressCard from '@/components/dashboard/TargetProgressCard';

const TodayEconomicNews = dynamic(() => import('@/components/calendar/TodayEconomicNews'), {
  loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-48" />,
});
const WeeklyEconomicNews = dynamic(() => import('@/components/calendar/WeeklyEconomicNews'), {
  loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-48" />,
});

import { ArrowLeft, Settings, Wallet } from 'lucide-react';

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  PROP_FIRM: 'Prop Firm',
  FUTURES: 'Futures',
  CFD: 'CFD',
  FOREX: 'Forex',
  SHARE: 'Share',
  DEMO: 'Demo',
};

const HEALTH_STYLES: Record<string, { border: string; badge: string }> = {
  SAFE: { border: 'border-green-400', badge: 'bg-green-100 text-green-700' },
  WARNING: { border: 'border-yellow-400', badge: 'bg-yellow-100 text-yellow-700' },
  BREACHED: { border: 'border-red-500', badge: 'bg-red-100 text-red-700' },
};

export default async function AccountDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { id } = await params;

  const account = await getAccount(id, session.user.id).catch(() => null);
  if (!account) notFound();

  const [stats, activeTargets, bestSop, symbolStats, cycleStatus, rules] = await Promise.all([
    getPersonalStats(session.user.id, 'all', id),
    getActiveTargetsWithProgress(session.user.id),
    getBestSopType(session.user.id, 'all', id),
    getSymbolStats(session.user.id, 'all', 5, id),
    getCycleStatus(id).catch(() => null),
    getAccountRules(id).catch(() => null),
  ]);

  const health = cycleStatus?.healthStatus ?? 'SAFE';
  const styles = HEALTH_STYLES[health];

  const totalTrades = stats.totalTrades;
  const winRate = stats.winRate;
  const sopRate = stats.sopRate;
  const netProfitLoss = stats.netProfitLossUsd ?? stats.totalProfitLossUsd;
  const grossProfitLoss = stats.totalProfitLossUsd;
  const totalCommission = stats.totalCommissionUsd ?? 0;
  const bestSession = stats.bestSession;

  // Empty state if no trades
  if (totalTrades === 0) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link
              href={`/accounts/${id}`}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {account.name}
            </Link>
          </div>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Wallet className="h-6 w-6 text-blue-600" />
                {account.name} — Dashboard
                {account.isDefault && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    Default
                  </span>
                )}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {ACCOUNT_TYPE_LABELS[account.accountType] ?? account.accountType} ·{' '}
                {account.currency}
              </p>
            </div>
            <Link
              href={`/accounts/${id}/settings`}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors border border-gray-200 rounded-lg px-3 py-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </div>
          <NoTradesEmptyState />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Account header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href={`/accounts/${id}`}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {account.name}
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-semibold text-gray-900">Dashboard</span>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${styles.badge}`}>
              {health}
            </span>
            <span className="text-xs text-gray-400">
              {ACCOUNT_TYPE_LABELS[account.accountType] ?? account.accountType} ·{' '}
              {account.currency}
            </span>
          </div>
          <Link
            href={`/accounts/${id}/settings`}
            className="shrink-0 flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            <Settings className="h-4 w-4" />
            Account Settings
          </Link>
        </div>

        {/* Daily Loss Alert */}
        <DailyLossAlert className="mb-6" />

        {/* Account Health Cards — only when rules are configured */}
        {cycleStatus &&
          (cycleStatus.dailyDrawdownUsedPct !== null ||
            cycleStatus.totalDrawdownUsedPct !== null ||
            cycleStatus.cycleTargetProfitUsd !== null ||
            cycleStatus.consistencyTargetPct !== null) && (
            <div className="space-y-4 sm:space-y-5 mb-6">
              {/* Account Health + Cycle Target side-by-side when target is set */}
              <div className={cycleStatus.cycleTargetProfitUsd ? 'grid gap-4 sm:grid-cols-2' : ''}>
                <DrawdownStatusCard status={cycleStatus} currency={account.currency ?? 'USD'} />
                {cycleStatus.cycleTargetProfitUsd && (
                  <CycleProfitTargetCard status={cycleStatus} currency={account.currency ?? 'USD'} />
                )}
              </div>
              <CycleInsightsCard
                status={cycleStatus}
                currency={account.currency ?? 'USD'}
                cycleStartFallback={account.createdAt}
              />
            </div>
          )}

        {/* No rules hint */}
        {!rules && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <span className="text-amber-500 text-lg shrink-0">💡</span>
            <p className="text-sm text-amber-700">
              <span className="font-medium">Set up drawdown rules & profit targets</span> in{' '}
              <Link
                href={`/accounts/${id}/settings`}
                className="underline hover:text-amber-900"
              >
                Account Settings
              </Link>{' '}
              to see health tracking here.
            </p>
          </div>
        )}

        {/* Quote of the Day */}
        <div className="mb-6">
          <QuoteOfTheDayWidget />
        </div>

        {/* Achievements */}
        <CollapsibleAchievementsSection accountId={id} />

        {/* Economic News */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 mb-6">
          <TodayEconomicNews />
          <WeeklyEconomicNews />
        </div>

        {/* Ranking */}
        <div className="mb-6">
          <RankingCard />
        </div>

        {/* Stats Cards + Best SOP */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3 mb-6">
          <div className="lg:col-span-2 grid gap-4 sm:gap-6 grid-cols-2">
            <div className="p-3 sm:p-4 md:p-6 bg-white rounded-lg shadow border">
              <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                Total Trades
              </h3>
              <p className="text-2xl sm:text-3xl font-bold">{totalTrades}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">All time</p>
            </div>
            <div className="p-3 sm:p-4 md:p-6 bg-white rounded-lg shadow border">
              <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                Win Rate
              </h3>
              <p
                className={`text-2xl sm:text-3xl font-bold ${
                  winRate >= 60
                    ? 'text-green-600'
                    : winRate >= 50
                      ? 'text-yellow-600'
                      : 'text-red-600'
                }`}
              >
                {winRate.toFixed(1)}%
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
                {stats.totalWins}W / {stats.totalLosses}L
              </p>
            </div>
            <div className="p-3 sm:p-4 md:p-6 bg-white rounded-lg shadow border">
              <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                SOP Compliance
              </h3>
              <p
                className={`text-2xl sm:text-3xl font-bold ${
                  sopRate >= 80
                    ? 'text-green-600'
                    : sopRate >= 60
                      ? 'text-yellow-600'
                      : 'text-red-600'
                }`}
              >
                {sopRate.toFixed(1)}%
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
                {stats.totalSopFollowed} / {totalTrades}
              </p>
            </div>
            <div className="p-3 sm:p-4 md:p-6 bg-white rounded-lg shadow border">
              <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                Net P/L
              </h3>
              <p
                className={`text-2xl sm:text-3xl font-bold ${
                  netProfitLoss > 0
                    ? 'text-green-600'
                    : netProfitLoss < 0
                      ? 'text-red-600'
                      : ''
                }`}
              >
                {netProfitLoss >= 0 ? '+' : '-'}${Math.abs(netProfitLoss).toFixed(2)}
              </p>
              {totalCommission !== 0 && (
                <div className="mt-1 sm:mt-2 space-y-0.5 text-xs text-muted-foreground">
                  <div>
                    Gross:{' '}
                    <span className={grossProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {grossProfitLoss >= 0 ? '+' : ''}${grossProfitLoss.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    Commission:{' '}
                    <span className="text-red-500">${totalCommission.toFixed(2)}</span>
                  </div>
                </div>
              )}
              {totalCommission === 0 && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">All time</p>
              )}
            </div>
          </div>
          <div className="lg:col-span-1">
            <BestSopCard data={bestSop} period="all" />
          </div>
        </div>

        {/* Symbol Performance */}
        {symbolStats.all.length > 0 && (
          <div className="mb-6">
            <SymbolStatsCard data={symbolStats} />
          </div>
        )}

        {/* Active Targets */}
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

        {activeTargets.length === 0 && (
          <div className="mb-8">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="text-4xl">🎯</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Set Your Trading Goals
                  </h3>
                  <p className="text-sm text-blue-700 mb-4">
                    Create targets to track your progress towards specific win rate, SOP compliance,
                    and profit goals.
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

        {/* Best Session Insight */}
        {bestSession && (
          <CollapsibleChartSection
            title="Best Trading Session"
            description={`Your highest win rate is during the ${bestSession} session — ${stats.bestSessionWinRate.toFixed(1)}%`}
            icon="🎯"
            defaultOpen={false}
          >
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-blue-800 mb-4">
                Consider focusing more trades during the{' '}
                <span className="font-semibold">{bestSession}</span> session.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(stats.sessionBreakdown).map(([sessionKey, data]) => (
                  <div
                    key={sessionKey}
                    className={`p-3 rounded-lg border-2 ${
                      sessionKey === bestSession
                        ? 'bg-blue-100 border-blue-300'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="text-xs font-medium text-gray-600 mb-1">{sessionKey}</div>
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

        {/* Session Chart */}
        {totalTrades > 0 && (
          <CollapsibleChartSection
            title="Session Win Rate Comparison"
            description="Win rate across market sessions"
            icon="📈"
            linkHref="/analytics/trends"
            linkText="View Trends →"
            defaultOpen={false}
          >
            <div className="mt-4">
              <SessionComparisonChartWrapper
                userId={session.user.id}
                bestSession={bestSession}
              />
            </div>
          </CollapsibleChartSection>
        )}

        {/* Hourly Heatmap */}
        {totalTrades > 0 && (
          <CollapsibleChartSection
            title="Hourly Performance Heatmap"
            description="Identify your most profitable trading hours"
            icon="🕐"
            defaultOpen={false}
          >
            <div className="mt-4">
              <HourlyHeatmapWrapper userId={session.user.id} />
            </div>
          </CollapsibleChartSection>
        )}
      </div>
    </div>
  );
}
