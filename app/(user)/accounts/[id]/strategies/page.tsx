import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getAccount } from '@/lib/services/tradingAccountService';
import { listStrategies, parseBestSessions } from '@/lib/services/accountStrategyService';
import { getCycleStatus } from '@/lib/services/accountRulesService';
import { StrategyPlaybook } from '@/components/strategies/StrategyPlaybook';

type Props = { params: Promise<{ id: string }> };

export default async function StrategiesPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { id } = await params;
  const [account, rawStrategies, cycleStatus] = await Promise.all([
    getAccount(id, session.user.id).catch(() => null),
    listStrategies(id, session.user.id).catch(() => []),
    getCycleStatus(id).catch(() => null),
  ]);

  if (!account) notFound();

  const strategies = rawStrategies.map((s) => ({
    ...s,
    bestSessions: parseBestSessions(s.bestSessions),
  }));

  // Current balance = starting balance + net retained earnings (P&L minus withdrawals)
  const currentBalance =
    cycleStatus != null
      ? account.startingBalance + cycleStatus.cumulativePnl
      : account.startingBalance || null;

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <Link
        href={`/accounts/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {account.name}
      </Link>

      <StrategyPlaybook
        accountId={id}
        accountName={account.name}
        initialStrategies={strategies}
        accountBalance={currentBalance}
      />
    </div>
  );
}
