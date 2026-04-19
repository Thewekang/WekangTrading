'use client';

import Link from 'next/link';
import { Wallet, LayoutDashboard, TrendingUp, Shield, BarChart2 } from 'lucide-react';
import { useActiveAccount } from '@/contexts/ActiveAccountContext';

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  PROP_FIRM: 'Prop Firm',
  FUTURES: 'Futures',
  CFD: 'CFD',
  FOREX: 'Forex',
  SHARE: 'Share',
  DEMO: 'Demo',
};

export function AccountContextStrip() {
  const { activeAccount } = useActiveAccount();

  if (!activeAccount) return null;

  return (
    <div className="bg-indigo-600 text-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-9">
          {/* Account name — links to account landing */}
          <Link
            href={`/accounts/${activeAccount.id}`}
            className="flex items-center gap-1.5 text-xs font-semibold hover:text-indigo-200 transition-colors"
          >
            <Wallet className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate max-w-[140px] sm:max-w-none">{activeAccount.name}</span>
            <span className="text-indigo-300 font-normal hidden sm:inline">
              ({ACCOUNT_TYPE_LABELS[activeAccount.accountType] ?? activeAccount.accountType})
            </span>
          </Link>

          {/* Quick nav links */}
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto">
            <Link
              href={`/accounts/${activeAccount.id}/dashboard`}
              className="flex items-center gap-1 text-xs text-indigo-200 hover:text-white transition-colors shrink-0"
            >
              <LayoutDashboard className="h-3 w-3" />
              Dashboard
            </Link>
            <Link
              href="/trades"
              className="flex items-center gap-1 text-xs text-indigo-200 hover:text-white transition-colors shrink-0"
            >
              <TrendingUp className="h-3 w-3" />
              Trades
            </Link>
            <Link
              href="/discipline-tracker"
              className="flex items-center gap-1 text-xs text-indigo-200 hover:text-white transition-colors shrink-0"
            >
              <Shield className="h-3 w-3" />
              Discipline
            </Link>
            <Link
              href="/analytics/trends"
              className="flex items-center gap-1 text-xs text-indigo-200 hover:text-white transition-colors shrink-0"
            >
              <BarChart2 className="h-3 w-3" />
              Performance
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
