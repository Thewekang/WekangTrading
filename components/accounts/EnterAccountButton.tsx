'use client';

import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { useActiveAccount } from '@/contexts/ActiveAccountContext';

interface EnterAccountButtonProps {
  accountId: string;
  className?: string;
}

export function EnterAccountButton({ accountId, className = '' }: EnterAccountButtonProps) {
  const router = useRouter();
  const { setActiveAccount } = useActiveAccount();

  const handleEnter = () => {
    setActiveAccount(accountId);
    router.push(`/accounts/${accountId}`);
  };

  return (
    <button
      onClick={handleEnter}
      className={`flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${className}`}
    >
      <LogIn className="h-4 w-4" />
      Enter Account
    </button>
  );
}
