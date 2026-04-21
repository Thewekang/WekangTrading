'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTradingAccountSchema } from '@/lib/validations';

type FormValues = {
  name: string;
  accountType: 'PROP_FIRM' | 'FUTURES' | 'CFD' | 'FOREX' | 'SHARE' | 'DEMO';
  currency: string;
  startingBalance: number;
};

const ACCOUNT_TYPES = [
  { value: 'PROP_FIRM', label: 'Prop Firm' },
  { value: 'FUTURES', label: 'Futures' },
  { value: 'CFD', label: 'CFD' },
  { value: 'FOREX', label: 'Forex' },
  { value: 'SHARE', label: 'Share' },
  { value: 'DEMO', label: 'Demo' },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'SGD', 'MYR', 'AUD', 'JPY'];

export default function NewAccountPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createTradingAccountSchema) as any,
    defaultValues: {
      name: '',
      accountType: 'FUTURES',
      currency: 'USD',
      startingBalance: 0,
    },
  });

  const onSubmit = async (data: FormValues) => {    setServerError(null);
    try {
      const res = await fetch('/api/trading-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) {
        setServerError(json.error?.message ?? 'Failed to create account');
        return;
      }
      router.push('/accounts');
      router.refresh();
    } catch {
      setServerError('Network error. Please try again.');
    }
  };

  const { register, handleSubmit, formState: { errors, isSubmitting } } = form;

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Trading Account</h1>

      <form onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])} className="bg-white rounded-lg border p-6 space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Account Name *</label>
          <input
            {...register('name')}
            placeholder="e.g. FTMO Challenge, Personal Futures"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        {/* Account Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Account Type *</label>
          <select
            {...register('accountType')}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ACCOUNT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          {errors.accountType && <p className="text-red-500 text-xs mt-1">{errors.accountType.message}</p>}
        </div>

        {/* Currency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Currency *</label>
          <select
            {...register('currency')}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Starting Balance */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Starting Balance</label>
          <input
            {...register('startingBalance', { valueAsNumber: true })}
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g. 10000"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.startingBalance && <p className="text-red-500 text-xs mt-1">{errors.startingBalance.message}</p>}
        </div>

        {serverError && (
          <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded p-3">{serverError}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors"
          >
            {isSubmitting ? 'Creating…' : 'Create Account'}
          </button>
        </div>
      </form>
    </div>
  );
}
