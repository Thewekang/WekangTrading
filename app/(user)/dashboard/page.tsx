import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getUserAccounts } from '@/lib/services/tradingAccountService';
import { getCycleStatus } from '@/lib/services/accountRulesService';
import { Plus, Settings, Wallet } from 'lucide-react';
import { EnterAccountButton } from '@/components/accounts/EnterAccountButton';

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  PROP_FIRM: 'Prop Firm',
  FUTURES: 'Futures',
  CFD: 'CFD',
  FOREX: 'Forex',
  SHARE: 'Share',
  DEMO: 'Demo',
};

const HEALTH_STYLES: Record<string, { border: string; badge: string; dot: string }> = {
  SAFE: {
    border: 'border-green-400',
    badge: 'bg-green-100 text-green-700',
    dot: 'bg-green-500',
  },
  WARNING: {
    border: 'border-yellow-400',
    badge: 'bg-yellow-100 text-yellow-700',
    dot: 'bg-yellow-500',
  },
  BREACHED: {
    border: 'border-red-500',
    badge: 'bg-red-100 text-red-700',
    dot: 'bg-red-500',
  },
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const accounts = await getUserAccounts(session.user.id);

  // Fetch cycle status for all accounts in parallel
  const statusResults = await Promise.allSettled(accounts.map((a) => getCycleStatus(a.id)));

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Image
            src="/logo.png"
            alt="Wekang Trading"
            width={48}
            height={48}
            className="object-contain"
            priority
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {session.user.name?.split(' ')[0] ?? session.user.name}!
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Select a trading account to continue</p>
          </div>
        </div>
        <Link
          href="/accounts/new"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Account
        </Link>
      </div>

      {/* Account Cards */}
      {accounts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200">
          <Wallet className="h-14 w-14 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">No trading accounts yet</h2>
          <p className="text-gray-400 mb-6 max-w-xs mx-auto">
            Create your first account to start tracking your trades and performance
          </p>
          <Link
            href="/accounts/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold"
          >
            <Plus className="h-4 w-4" />
            Create Account
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {accounts.map((account, idx) => {
            const statusResult = statusResults[idx];
            const status = statusResult.status === 'fulfilled' ? statusResult.value : null;
            const health = status?.healthStatus ?? 'SAFE';
            const styles = HEALTH_STYLES[health];

            return (
              <div
                key={account.id}
                className={`bg-white rounded-xl border-2 ${styles.border} p-5 flex flex-col gap-4 shadow-sm`}
              >
                {/* Account header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2.5 w-2.5 rounded-full shrink-0 mt-0.5 ${styles.dot}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-bold text-gray-900 text-base">{account.name}</h2>
                        {account.isDefault && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {ACCOUNT_TYPE_LABELS[account.accountType] ?? account.accountType} · {account.currency}
                        {account.startingBalance ? ` · $${account.startingBalance.toLocaleString()}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${styles.badge}`}>
                    {health}
                  </span>
                </div>

                {/* Cycle & drawdown stats */}
                {status && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-0.5">Cycle P&L</p>
                      <p
                        className={`text-sm font-bold ${status.currentCyclePnl >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {status.currentCyclePnl >= 0 ? '+' : ''}
                        {status.currentCyclePnl.toFixed(2)} {account.currency}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-0.5">Cumulative P&L</p>
                      <p
                        className={`text-sm font-bold ${status.cumulativePnl >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {status.cumulativePnl >= 0 ? '+' : ''}
                        {status.cumulativePnl.toFixed(2)} {account.currency}
                      </p>
                    </div>
                    {status.dailyDrawdownUsedPct !== null && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-0.5">Daily DD Used</p>
                        <p
                          className={`text-sm font-bold ${(status.dailyDrawdownUsedPct ?? 0) >= 80 ? 'text-red-600' : 'text-gray-700'}`}
                        >
                          {status.dailyDrawdownUsedPct?.toFixed(1)}%
                        </p>
                      </div>
                    )}
                    {status.totalDrawdownUsedPct !== null && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-0.5">Total DD Used</p>
                        <p
                          className={`text-sm font-bold ${(status.totalDrawdownUsedPct ?? 0) >= 80 ? 'text-red-600' : 'text-gray-700'}`}
                        >
                          {status.totalDrawdownUsedPct?.toFixed(1)}%
                        </p>
                      </div>
                    )}
                    {status.lastWithdrawal && (
                      <div className="col-span-2 bg-purple-50 rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-purple-500 mb-0.5">Last Withdrawal</p>
                          <p className="text-sm font-bold text-purple-700">
                            −{status.lastWithdrawal.amount.toFixed(2)} {account.currency}
                          </p>
                        </div>
                        <p className="text-xs text-purple-400">{status.lastWithdrawal.date}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-auto pt-1">
                  <EnterAccountButton accountId={account.id} className="flex-1" />
                  <Link
                    href={`/accounts/${account.id}/settings`}
                    className="flex items-center justify-center h-10 w-10 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors shrink-0"
                    title="Account settings"
                  >
                    <Settings className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
