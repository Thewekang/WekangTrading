import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getAccount, getAccountRules } from '@/lib/services/tradingAccountService';
import { getCycleStatus } from '@/lib/services/accountRulesService';
import { DrawdownStatusCard } from '@/components/dashboard/DrawdownStatusCard';
import { CycleInsightsCard } from '@/components/dashboard/CycleInsightsCard';
import {
  ArrowLeft,
  LayoutDashboard,
  Plus,
  TrendingUp,
  Shield,
  BarChart2,
  Target,
  Settings,
  Wallet,
  Trophy,
} from 'lucide-react';

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

export default async function AccountLandingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { id } = await params;

  const account = await getAccount(id, session.user.id).catch(() => null);
  if (!account) notFound();

  const [cycleStatus, rules] = await Promise.all([
    getCycleStatus(id).catch(() => null),
    getAccountRules(id).catch(() => null),
  ]);

  const health = cycleStatus?.healthStatus ?? 'SAFE';
  const styles = HEALTH_STYLES[health];

  const quickActions = [
    {
      href: `/accounts/${id}/dashboard`,
      icon: LayoutDashboard,
      label: 'Dashboard',
      description: 'Stats, news & charts',
      color: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600',
    },
    {
      href: '/trades/new',
      icon: Plus,
      label: 'New Trade',
      description: 'Record a trade now',
      color: 'bg-white hover:bg-gray-50 text-gray-900 border-gray-200',
    },
    {
      href: '/trades',
      icon: TrendingUp,
      label: 'Trades',
      description: 'View trade history',
      color: 'bg-white hover:bg-gray-50 text-gray-900 border-gray-200',
    },
    {
      href: '/discipline-tracker',
      icon: Shield,
      label: 'Discipline',
      description: 'Track daily rules',
      color: 'bg-white hover:bg-gray-50 text-gray-900 border-gray-200',
    },
    {
      href: '/analytics/trends',
      icon: BarChart2,
      label: 'Performance',
      description: 'Analytics & trends',
      color: 'bg-white hover:bg-gray-50 text-gray-900 border-gray-200',
    },
    {
      href: '/targets',
      icon: Target,
      label: 'Targets',
      description: 'Goals & progress',
      color: 'bg-white hover:bg-gray-50 text-gray-900 border-gray-200',
    },
    {
      href: `/accounts/${id}/settings`,
      icon: Settings,
      label: 'Account Settings',
      description: 'Rules & withdrawals',
      color: 'bg-white hover:bg-gray-50 text-gray-900 border-gray-200',
    },
    {
      href: '/dashboard/achievements',
      icon: Trophy,
      label: 'Achievements',
      description: 'Badges & milestones',
      color: 'bg-white hover:bg-gray-50 text-gray-900 border-gray-200',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        All Accounts
      </Link>

      {/* Account header card */}
      <div className={`bg-white rounded-xl border-2 ${styles.border} p-5 mb-6 shadow-sm`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-xl shrink-0">
              <Wallet className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{account.name}</h1>
                {account.isDefault && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full font-medium">
                    Default
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                {ACCOUNT_TYPE_LABELS[account.accountType] ?? account.accountType} ·{' '}
                {account.currency}
                {account.startingBalance
                  ? ` · Starting balance: ${account.startingBalance.toLocaleString()} ${account.currency}`
                  : ''}
              </p>
            </div>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${styles.badge}`}>
            {health}
          </span>
        </div>
      </div>

      {/* Drawdown & Cycle P&L Cards */}
      {cycleStatus &&
        (cycleStatus.dailyDrawdownUsedPct !== null ||
          cycleStatus.totalDrawdownUsedPct !== null ||
          cycleStatus.cycleTargetProfitUsd !== null) && (
          <div className="grid gap-4 sm:grid-cols-2 mb-6">
            <DrawdownStatusCard status={cycleStatus} currency={account.currency ?? 'USD'} />
            <CycleInsightsCard
              status={cycleStatus}
              currency={account.currency ?? 'USD'}
              cycleStartFallback={account.createdAt}
            />
          </div>
        )}

      {/* No rules configured hint */}
      {!rules && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <span className="text-amber-500 text-lg shrink-0">💡</span>
          <div>
            <p className="text-sm font-medium text-amber-800">Set up account rules</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Configure drawdown limits and profit targets in{' '}
              <Link href={`/accounts/${id}/settings`} className="underline hover:text-amber-800">
                Account Settings
              </Link>{' '}
              to track your risk management.
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Quick Actions
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={`flex flex-col gap-2.5 p-4 rounded-xl border transition-colors ${action.color}`}
            >
              <Icon className="h-5 w-5" />
              <div>
                <p className="font-semibold text-sm leading-tight">{action.label}</p>
                <p className="text-xs opacity-60 mt-0.5 leading-tight">{action.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

