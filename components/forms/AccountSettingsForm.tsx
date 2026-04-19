'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { updateTradingAccountSchema, accountRulesSchema } from '@/lib/validations';

// ------------------------------------------------
// Types
// ------------------------------------------------

type AccountData = {
  id: string;
  name: string;
  accountType: string;
  currency: string;
  startingBalance: number | null;
  isDefault: boolean;
  active: boolean;
};

type Rules = {
  dailyDrawdownPct: number | null;
  totalDrawdownPct: number | null;
  consistencyTargetPct: number | null;
  cycleTargetProfitUsd: number | null;
  dailyResetTimezone: string | null;
} | null;

type WithdrawalHistoryItem = {
  id: string;
  withdrawalDate: string;
  withdrawalAmount: number;
  notes: string | null;
};

type UpdateAccountValues = z.infer<typeof updateTradingAccountSchema>;
type RulesValues = z.infer<typeof accountRulesSchema>;

const ACCOUNT_TYPES = [
  { value: 'PROP_FIRM', label: 'Prop Firm' },
  { value: 'FUTURES', label: 'Futures' },
  { value: 'CFD', label: 'CFD' },
  { value: 'FOREX', label: 'Forex' },
  { value: 'SHARE', label: 'Share' },
  { value: 'DEMO', label: 'Demo' },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'SGD', 'MYR', 'AUD', 'JPY'];

const BROKER_TIMEZONES = [
  { value: 'UTC', label: 'UTC (default)' },
  { value: 'America/Chicago', label: 'CT — America/Chicago (Tradovate, Apex, TopStep)' },
  { value: 'America/New_York', label: 'ET — America/New_York' },
  { value: 'America/Los_Angeles', label: 'PT — America/Los_Angeles' },
  { value: 'Europe/London', label: 'GMT/BST — Europe/London' },
  { value: 'Europe/Prague', label: 'CET — Europe/Prague (FTMO)' },
  { value: 'Asia/Kuala_Lumpur', label: 'MYT — Asia/Kuala_Lumpur' },
  { value: 'Asia/Singapore', label: 'SGT — Asia/Singapore' },
  { value: 'Asia/Tokyo', label: 'JST — Asia/Tokyo' },
  { value: 'Australia/Sydney', label: 'AEST — Australia/Sydney' },
];

// ------------------------------------------------
// Account Info Section
// ------------------------------------------------

function AccountInfoSection({ account }: { account: AccountData }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<UpdateAccountValues>({
    resolver: zodResolver(updateTradingAccountSchema),
    defaultValues: {
      name: account.name,
      accountType: account.accountType as UpdateAccountValues['accountType'],
      currency: account.currency,
      startingBalance: account.startingBalance ?? 0,
    },
  });

  const onSubmit = async (data: UpdateAccountValues) => {
    setError(null);
    setSuccess(false);
    const res = await fetch(`/api/trading-accounts/${account.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) { setError(json.error?.message ?? 'Failed to update'); return; }
    setSuccess(true);
    router.refresh();
  };

  const handleSetDefault = async () => {
    setError(null);
    const res = await fetch(`/api/trading-accounts/${account.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setDefault: true }),
    });
    const json = await res.json();
    if (!json.success) { setError(json.error?.message ?? 'Failed'); return; }
    router.refresh();
  };

  const { register, handleSubmit, formState: { errors, isSubmitting } } = form;

  return (
    <section className="bg-white rounded-lg border p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Account Info</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input {...register('name')} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select {...register('accountType')} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              {ACCOUNT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select {...register('currency')} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Starting Balance</label>
          <input {...register('startingBalance', { valueAsNumber: true })} type="number" step="0.01" min="0" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">Saved!</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors">
            {isSubmitting ? 'Saving…' : 'Save Changes'}
          </button>
          {!account.isDefault && (
            <button type="button" onClick={handleSetDefault} className="flex-1 border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Set as Default
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

// ------------------------------------------------
// Rules Section
// ------------------------------------------------

function RulesSection({ accountId, initialRules }: { accountId: string; initialRules: Rules }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<RulesValues>({
    resolver: zodResolver(accountRulesSchema),
    defaultValues: {
      dailyDrawdownPct: initialRules?.dailyDrawdownPct ?? undefined,
      totalDrawdownPct: initialRules?.totalDrawdownPct ?? undefined,
      consistencyTargetPct: initialRules?.consistencyTargetPct ?? undefined,
      cycleTargetProfitUsd: initialRules?.cycleTargetProfitUsd ?? undefined,
      dailyResetTimezone: initialRules?.dailyResetTimezone ?? 'UTC',
    },
  });

  const onSubmit = async (data: RulesValues) => {
    setError(null);
    setSuccess(false);
    const res = await fetch(`/api/trading-accounts/${accountId}/rules`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) { setError(json.error?.message ?? 'Failed to save rules'); return; }
    setSuccess(true);
  };

  const { register, handleSubmit, formState: { errors, isSubmitting } } = form;

  return (
    <section className="bg-white rounded-lg border p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Risk Rules</h2>
      <p className="text-sm text-gray-500">Leave fields blank to disable that rule.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Daily Drawdown Limit (%)</label>
            <input {...register('dailyDrawdownPct', { setValueAs: (v) => v === '' ? null : parseFloat(v) })} type="number" step="0.1" min="0.1" max="100" placeholder="e.g. 5" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
            {errors.dailyDrawdownPct && <p className="text-red-500 text-xs mt-1">{errors.dailyDrawdownPct.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Drawdown Limit (%)</label>
            <input {...register('totalDrawdownPct', { setValueAs: (v) => v === '' ? null : parseFloat(v) })} type="number" step="0.1" min="0.1" max="100" placeholder="e.g. 10" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
            {errors.totalDrawdownPct && <p className="text-red-500 text-xs mt-1">{errors.totalDrawdownPct.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Consistency Target (%)</label>
            <input {...register('consistencyTargetPct', { setValueAs: (v) => v === '' ? null : parseFloat(v) })} type="number" step="1" min="1" max="100" placeholder="e.g. 30" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
            <p className="text-xs text-gray-400 mt-0.5">Best day &lt;= X% of total cycle P&L</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cycle Profit Target ($)</label>
            <input {...register('cycleTargetProfitUsd', { setValueAs: (v) => v === '' ? null : parseFloat(v) })} type="number" step="0.01" min="0" placeholder="e.g. 1000" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Daily Reset Timezone</label>
          <select {...register('dailyResetTimezone')} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
            {BROKER_TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-0.5">Match your broker&apos;s trading day boundary (e.g. CME: America/Chicago, FTMO: Europe/Prague)</p>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">Rules saved!</p>}
        <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors">
          {isSubmitting ? 'Saving…' : 'Save Rules'}
        </button>
      </form>
    </section>
  );
}

// ------------------------------------------------
// Withdrawal Section
// ------------------------------------------------

function WithdrawalSection({ accountId, history }: { accountId: string; history: WithdrawalHistoryItem[] }) {
  const router = useRouter();
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/trading-accounts/${accountId}/withdrawal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalDate: date, withdrawalAmount: parseFloat(amount), notes: notes || undefined }),
      });
      const json = await res.json();
      if (!json.success) { setError(json.error?.message ?? 'Failed'); return; }
      setDate(''); setAmount(''); setNotes('');
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-white rounded-lg border p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Withdrawals</h2>
      <p className="text-sm text-gray-500">Recording a withdrawal resets the cycle start date.</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="e.g. 500" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" disabled={submitting} className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors">
          {submitting ? 'Recording…' : 'Record Withdrawal'}
        </button>
      </form>

      {history.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">History</h3>
          <div className="space-y-2">
            {history.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm border-b pb-2">
                <span className="text-gray-500">{item.withdrawalDate}</span>
                <span className="font-medium text-gray-800">${item.withdrawalAmount.toFixed(2)}</span>
                {item.notes && <span className="text-gray-400 text-xs truncate max-w-[120px]">{item.notes}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ------------------------------------------------
// Main Component
// ------------------------------------------------

interface AccountSettingsFormProps {
  account: AccountData;
  initialRules: Rules;
  withdrawalHistory: WithdrawalHistoryItem[];
}

export function AccountSettingsForm({ account, initialRules, withdrawalHistory }: AccountSettingsFormProps) {
  return (
    <div className="space-y-6">
      <AccountInfoSection account={account} />
      <RulesSection accountId={account.id} initialRules={initialRules} />
      <WithdrawalSection accountId={account.id} history={withdrawalHistory} />
    </div>
  );
}
