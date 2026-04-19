import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { getAccount, getAccountRules } from '@/lib/services/tradingAccountService';
import { getWithdrawalHistory } from '@/lib/services/accountRulesService';
import { AccountSettingsForm } from '@/components/forms/AccountSettingsForm';

type Props = { params: Promise<{ id: string }> };

export default async function AccountSettingsPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { id } = await params;
  const [account, rules, withdrawalHistory] = await Promise.all([
    getAccount(id, session.user.id),
    getAccountRules(id),
    getWithdrawalHistory(id),
  ]);

  if (!account) notFound();

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{account.name}</h1>
      <p className="text-sm text-gray-500 mb-6">Account settings, rules & withdrawal history</p>
      <AccountSettingsForm
        account={account}
        initialRules={rules}
        withdrawalHistory={withdrawalHistory}
      />
    </div>
  );
}
