import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getUserAccounts } from '@/lib/services/tradingAccountService';
import { getCycleStatus } from '@/lib/services/accountRulesService';
import { Plus, Settings, Wallet } from 'lucide-react';
import { AccountActions } from '@/components/accounts/AccountActions';

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  PROP_FIRM: 'Prop Firm',
  FUTURES: 'Futures',
  CFD: 'CFD',
  FOREX: 'Forex',
  SHARE: 'Share',
  DEMO: 'Demo',
};

const HEALTH_BORDER: Record<string, string> = {
  SAFE: 'border-green-400',
  WARNING: 'border-yellow-400',
  BREACHED: 'border-red-500',
};

const HEALTH_BADGE: Record<string, string> = {
  SAFE: 'bg-green-100 text-green-700',
  WARNING: 'bg-yellow-100 text-yellow-700',
  BREACHED: 'bg-red-100 text-red-700',
};

export default async function AccountsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const accounts = await getUserAccounts(session.user.id);

  // Fetch cycle status in parallel for all accounts
  const statusResults = await Promise.allSettled(
    accounts.map((a) => getCycleStatus(a.id))
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trading Accounts</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your trading accounts and rules</p>
        </div>
        <Link
          href="/accounts/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Account
        </Link>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border">
          <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No trading accounts yet</p>
          <Link
            href="/accounts/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Create your first account
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {accounts.map((account, idx) => {
            const statusResult = statusResults[idx];
            const status = statusResult.status === 'fulfilled' ? statusResult.value : null;
            const health = status?.healthStatus ?? 'SAFE';

            return (
              <div
                key={account.id}
                className={`bg-white rounded-lg border-2 ${HEALTH_BORDER[health]} p-5 flex flex-col gap-3`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-gray-900">{account.name}</h2>
                      {account.isDefault && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Default</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {ACCOUNT_TYPE_LABELS[account.accountType] ?? account.accountType} · {account.currency}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${HEALTH_BADGE[health]}`}>
                    {health}
                  </span>
                </div>

                {status && (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-50 rounded p-2">
                      <p className="text-xs text-gray-400">Cycle P&L</p>
                      <p className={`font-semibold ${status.currentCyclePnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {status.currentCyclePnl >= 0 ? '+' : ''}
                        {status.currentCyclePnl.toFixed(2)} {account.currency}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <p className="text-xs text-gray-400">Cumulative P&L</p>
                      <p className={`font-semibold ${status.cumulativePnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {status.cumulativePnl >= 0 ? '+' : ''}
                        {status.cumulativePnl.toFixed(2)} {account.currency}
                      </p>
                    </div>
                    {status.dailyDrawdownUsedPct !== null && (
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-xs text-gray-400">Daily DD Used</p>
                        <p className={`font-semibold ${(status.dailyDrawdownUsedPct ?? 0) > 80 ? 'text-red-600' : 'text-gray-700'}`}>
                          {status.dailyDrawdownUsedPct?.toFixed(1) ?? '—'}%
                        </p>
                      </div>
                    )}
                    {status.totalDrawdownUsedPct !== null && (
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-xs text-gray-400">Total DD Used</p>
                        <p className={`font-semibold ${(status.totalDrawdownUsedPct ?? 0) > 80 ? 'text-red-600' : 'text-gray-700'}`}>
                          {status.totalDrawdownUsedPct?.toFixed(1) ?? '—'}%
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <AccountActions
                    accountId={account.id}
                    accountName={account.name}
                    isDefault={account.isDefault}
                    isOnlyAccount={accounts.length <= 1}
                  />
                  <Link
                    href={`/accounts/${account.id}/settings`}
                    className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
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
