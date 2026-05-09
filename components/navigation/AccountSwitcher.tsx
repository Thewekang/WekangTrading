'use client';

import { useRouter } from 'next/navigation';
import { ChevronDown, Wallet, Plus, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useActiveAccount } from '@/contexts/ActiveAccountContext';

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  PROP_FIRM: 'Prop Firm',
  FUTURES: 'Futures',
  CFD: 'CFD',
  FOREX: 'Forex',
  SHARE: 'Share',
  DEMO: 'Demo',
};

const HEALTH_COLORS: Record<string, string> = {
  SAFE: 'bg-green-500',
  WARNING: 'bg-yellow-500',
  BREACHED: 'bg-red-500',
};

interface AccountSwitcherProps {
  /** Optional map of accountId → healthStatus for colour dots */
  healthMap?: Record<string, 'SAFE' | 'WARNING' | 'BREACHED'>;
}

export function AccountSwitcher({ healthMap = {} }: AccountSwitcherProps) {
  const router = useRouter();
  const { activeAccount, accounts, setActiveAccount, isLoading } = useActiveAccount();

  if (isLoading || accounts.length === 0) {
    return null;
  }

  const handleSwitch = (accountId: string) => {
    setActiveAccount(accountId);
    router.push(`/accounts/${accountId}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors border border-gray-200">
          <Wallet className="h-4 w-4 text-gray-500 shrink-0" />
          <span className="max-w-[120px] truncate">{activeAccount?.name ?? 'Select Account'}</span>
          {activeAccount && healthMap[activeAccount.id] && (
            <span className={`h-2 w-2 rounded-full shrink-0 ${HEALTH_COLORS[healthMap[activeAccount.id]]}`} />
          )}
          <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {accounts.map((account) => (
          <DropdownMenuItem
            key={account.id}
            onClick={() => handleSwitch(account.id)}
            className="flex items-center justify-between gap-2 cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              {healthMap[account.id] && (
                <span className={`h-2 w-2 rounded-full shrink-0 ${HEALTH_COLORS[healthMap[account.id]]}`} />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{account.name}</p>
                <p className="text-xs text-gray-400">
                  {ACCOUNT_TYPE_LABELS[account.accountType] ?? account.accountType} · {account.currency}
                </p>
              </div>
            </div>
            {account.id === activeAccount?.id && (
              <Check className="h-4 w-4 text-green-600 shrink-0" />
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => router.push('/accounts')}
          className="cursor-pointer text-gray-600"
        >
          <Wallet className="h-4 w-4 mr-2" />
          Manage Accounts
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => router.push('/accounts/new')}
          className="cursor-pointer text-gray-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
