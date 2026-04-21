'use client';

/**
 * Real-Time Trade Entry Form
 * Mobile-optimized for quick entry during trading sessions
 */

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDebouncedCallback } from 'use-debounce';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { individualTradeSchema, transactionTradeSchema, commissionTradeSchema } from '@/lib/validations';
import { BadgeCelebration } from '@/components/animations/BadgeCelebration';
import { useTimezone } from '@/contexts/TimezoneContext';
import { useActiveAccount } from '@/contexts/ActiveAccountContext';
import { COMMON_TIMEZONES, datetimeLocalToUTC as convertToUTC } from '@/lib/utils/timezones';
import type { Badge } from '@/lib/db/schema';
import { z } from 'zod';

// Form schema that accepts datetime-local string input — supports both TRANSACTION and COMMISSION
const realTimeTradeFormSchema = z.discriminatedUnion('entryType', [
  transactionTradeSchema.extend({
    tradeTimestamp: z.union([
      z.date(),
      z.string().min(1, 'Trade time is required'),
    ]),
  }),
  commissionTradeSchema.extend({
    tradeTimestamp: z.union([
      z.date(),
      z.string().min(1, 'Trade time is required'),
    ]),
  }),
]);

interface SopType {
  id: string;
  name: string;
  description: string | null;
}

// Helper function to format Date to datetime-local format
function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function RealTimeTradeEntryForm() {
  const router = useRouter();
  const { timezone: userTimezone, toDatetimeLocal } = useTimezone();
  const { activeAccount } = useActiveAccount();
  const [entryTimezone, setEntryTimezone] = useState(userTimezone); // Timezone for this entry
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [sopTypes, setSopTypes] = useState<SopType[]>([]);
  const [loadingSopTypes, setLoadingSopTypes] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(realTimeTradeFormSchema),
    defaultValues: {
      entryType: 'TRANSACTION' as 'TRANSACTION' | 'COMMISSION',
      result: 'WIN',
      sopFollowed: undefined,
      sopTypeId: null,
      profitLossUsd: 0,
      notes: '',
      tradeTimestamp: '', // Store as string initially
    },
  });

  // Debounced validation for number inputs (300ms delay)
  const debouncedValidation = useDebouncedCallback(
    (fieldName: string) => {
      trigger(fieldName as any);
    },
    300
  );

  const watchedEntryType = watch('entryType') as 'TRANSACTION' | 'COMMISSION';
  const watchedResult = watch('result') as 'WIN' | 'LOSS' | 'BE' | undefined;
  const isCommission = watchedEntryType === 'COMMISSION';
  const isBreakEven = !isCommission && watchedResult === 'BE';

  // Set timestamp after component mounts to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
    const now = new Date();
    // Format as datetime-local string
    setValue('tradeTimestamp', formatDateForInput(now));
  }, [setValue]);

  // Fetch SOP types
  useEffect(() => {
    const fetchSopTypes = async () => {
      try {
        const response = await fetch('/api/sop-types');
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setSopTypes(result.data);
          }
        }
      } catch (error) {
        console.error('Failed to load SOP types:', error);
      } finally {
        setLoadingSopTypes(false);
      }
    };
    fetchSopTypes();
  }, []);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Convert string values to proper types
      let profitLoss = typeof data.profitLossUsd === 'string' ? parseFloat(data.profitLossUsd) : data.profitLossUsd;
      
      if (data.entryType === 'TRANSACTION') {
        if (data.result === 'BE') {
          // Break-even: force profitLoss to exactly 0
          profitLoss = 0;
        } else if (data.result === 'LOSS' && profitLoss > 0) {
          // Auto-negate for LOSS trades if user entered positive number
          profitLoss = -profitLoss;
        } else if (data.result === 'WIN' && profitLoss < 0) {
          // Auto-negate for WIN trades if user entered negative number
          profitLoss = Math.abs(profitLoss);
        }
      } else {
        // Commission: ensure positive (API will negate it)
        profitLoss = Math.abs(profitLoss);
      }
      
      // Convert datetime-local string to UTC using selected entry timezone
      const datetimeString = typeof data.tradeTimestamp === 'string' 
        ? data.tradeTimestamp 
        : formatDateForInput(data.tradeTimestamp);
      const utcTimestamp = convertToUTC(datetimeString, entryTimezone);
      
      const submitData: Record<string, unknown> = {
        entryType: data.entryType,
        tradeTimestamp: utcTimestamp.toISOString(),
        profitLossUsd: profitLoss,
        symbol: data.symbol || undefined,
        notes: data.notes || undefined,
        accountId: activeAccount?.id ?? null,
      };

      // Include transaction-only fields for TRANSACTION entries
      if (data.entryType === 'TRANSACTION') {
        submitData.result = data.result;
        submitData.sopFollowed = data.sopFollowed;
        submitData.sopTypeId = data.sopTypeId || null;
      }

      const response = await fetch('/api/trades/individual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setErrorMessage(result.error?.message || 'Failed to create trade');
        return;
      }
      
      // Check if badges were earned
      if (result.badges && result.badges.length > 0) {
        setEarnedBadges(result.badges);
        setShowCelebration(true);
        // Set flag to refresh achievements page
        localStorage.setItem('badgesUpdated', Date.now().toString());
      } else {
        // Still set flag for achievements page to refresh progress
        localStorage.setItem('badgesUpdated', Date.now().toString());
      }
      
      // Success
      setSuccessMessage('✅ Trade recorded successfully!');
      
      // Refresh daily loss alert if available
      if (typeof (window as any).refreshDailyLossAlert === 'function') {
        (window as any).refreshDailyLossAlert();
      }
      
      // Reset form for next entry
      reset({
        entryType: data.entryType, // keep same entry type for quick consecutive entries
        result: 'WIN',
        sopFollowed: undefined,
        sopTypeId: null,
        profitLossUsd: 0,
        notes: '',
      });
      
      // Set new timestamp after reset
      setValue('tradeTimestamp', formatDateForInput(new Date()));

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <img src="/logo.png" alt="Wekang Trading" className="w-8 h-8 object-contain" />
          Quick Trade Entry
        </h2>
        <p className="text-sm text-gray-600">Record your trade in real-time</p>
      </div>

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Display all form errors */}
        {Object.keys(errors).length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="font-semibold text-red-800 mb-2">Please fix the following errors:</p>
            <ul className="text-sm text-red-700 list-disc list-inside">
              {errors.tradeTimestamp && <li>Trade timestamp: {String(errors.tradeTimestamp.message)}</li>}
              {errors.entryType && <li>Entry type: {String(errors.entryType.message)}</li>}
              {(errors as any).result && <li>Result: {String((errors as any).result.message)}</li>}
              {(errors as any).sopFollowed && <li>SOP Compliance: {String((errors as any).sopFollowed.message)}</li>}
              {errors.profitLossUsd && <li>Amount: {String(errors.profitLossUsd.message)}</li>}
              {errors.notes && <li>Notes: {String(errors.notes.message)}</li>}
            </ul>
          </div>
        )}

        {/* ─── Entry Type Selector ─────────────────────────────────────────── */}
        <div>
          <Label className="text-sm sm:text-base font-medium">Entry Type *</Label>
          <Controller
            control={control}
            name="entryType"
            render={({ field }) => (
              <div className="mt-2 grid grid-cols-2 gap-3">
                <label className="relative">
                  <input
                    type="radio"
                    value="TRANSACTION"
                    checked={field.value === 'TRANSACTION'}
                    onChange={() => field.onChange('TRANSACTION')}
                    className="peer sr-only"
                  />
                  <div className="min-h-[60px] flex flex-col items-center justify-center cursor-pointer rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-center transition-all peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-700 hover:border-gray-400 active:scale-[0.97] touch-manipulation">
                    <span className="text-lg">📈</span>
                    <span className="font-semibold text-sm">Transaction</span>
                  </div>
                </label>
                <label className="relative">
                  <input
                    type="radio"
                    value="COMMISSION"
                    checked={field.value === 'COMMISSION'}
                    onChange={() => field.onChange('COMMISSION')}
                    className="peer sr-only"
                  />
                  <div className="min-h-[60px] flex flex-col items-center justify-center cursor-pointer rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-center transition-all peer-checked:border-amber-500 peer-checked:bg-amber-50 peer-checked:text-amber-700 hover:border-gray-400 active:scale-[0.97] touch-manipulation">
                    <span className="text-lg">💳</span>
                    <span className="font-semibold text-sm">Commission</span>
                  </div>
                </label>
              </div>
            )}
          />
          {isCommission && (
            <p className="mt-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              Commission entry — records broker fees/swaps for Futures trading. No WIN/LOSS or SOP fields needed.
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="tradeTimestamp" className="text-sm sm:text-base font-medium">Trade Time *</Label>
          <Controller
            control={control}
            name="tradeTimestamp"
            render={({ field }) => (
              <Input
                id="tradeTimestamp"
                type="datetime-local"
                value={isClient ? field.value : ''}
                onChange={(e) => field.onChange(e.target.value)}
                className="mt-2 text-base min-h-[48px]"
              />
            )}
          />
          {errors.tradeTimestamp && (
            <p className="mt-1 text-sm text-red-600">{String(errors.tradeTimestamp.message)}</p>
          )}
        </div>

        {/* Entry Timezone */}
        <div>
          <Label htmlFor="entryTimezone" className="text-sm sm:text-base font-medium">Entry Timezone</Label>
          <select
            id="entryTimezone"
            value={entryTimezone}
            onChange={(e) => setEntryTimezone(e.target.value)}
            disabled={isSubmitting}
            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2.5 text-base min-h-[48px] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
          >
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label} {tz.value === userTimezone && '(Your Setting)'}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Trade time will be interpreted as {entryTimezone} and converted to UTC
          </p>
        </div>

        {/* Result - Large Touch-Friendly Buttons — TRANSACTION only */}
        {!isCommission && (
        <div>
          <Label>Result *</Label>
          <div className="mt-2 grid grid-cols-3 gap-3">
            <label className="relative">
              <input
                type="radio"
                value="WIN"
                {...register('result')}
                className="peer sr-only"
              />
              <div className="min-h-[60px] flex items-center justify-center cursor-pointer rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-center font-semibold transition-all peer-checked:border-green-500 peer-checked:bg-green-50 peer-checked:text-green-700 hover:border-gray-400 active:scale-[0.97] touch-manipulation">
                ✅ WIN
              </div>
            </label>
            <label className="relative">
              <input
                type="radio"
                value="LOSS"
                {...register('result')}
                className="peer sr-only"
              />
              <div className="min-h-[60px] flex items-center justify-center cursor-pointer rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-center font-semibold transition-all peer-checked:border-red-500 peer-checked:bg-red-50 peer-checked:text-red-700 hover:border-gray-400 active:scale-[0.97] touch-manipulation">
                ❌ LOSS
              </div>
            </label>
            <label className="relative">
              <input
                type="radio"
                value="BE"
                {...register('result')}
                className="peer sr-only"
              />
              <div className="min-h-[60px] flex items-center justify-center cursor-pointer rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-center font-semibold transition-all peer-checked:border-gray-500 peer-checked:bg-gray-100 peer-checked:text-gray-700 hover:border-gray-400 active:scale-[0.97] touch-manipulation">
                ⚖️ BE
              </div>
            </label>
          </div>
          {(errors as any).result && (
            <p className="mt-1 text-sm text-red-600">{String((errors as any).result.message)}</p>
          )}
        </div>
        )}

        {/* SOP Followed — TRANSACTION only */}
        {!isCommission && (
        <div>
          <Label>SOP Compliance *</Label>
          <Controller
            control={control}
            name="sopFollowed"
            rules={{ required: !isCommission ? 'Please select whether you followed SOP or not' : false }}
            render={({ field }) => (
              <div className="mt-2 grid grid-cols-2 gap-3">
                <label className="relative">
                  <input
                    type="radio"
                    value="true"
                    checked={field.value === true}
                    onChange={() => field.onChange(true)}
                    className="peer sr-only"
                  />
                  <div className="min-h-[60px] flex items-center justify-center cursor-pointer rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-center font-semibold transition-all peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-700 hover:border-gray-400 active:scale-[0.97] touch-manipulation">
                    ✓ Followed SOP
                  </div>
                </label>
                <label className="relative">
                  <input
                    type="radio"
                    value="false"
                    checked={field.value === false}
                    onChange={() => field.onChange(false)}
                    className="peer sr-only"
                  />
                  <div className="min-h-[60px] flex items-center justify-center cursor-pointer rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-center font-semibold transition-all peer-checked:border-orange-500 peer-checked:bg-orange-50 peer-checked:text-orange-700 hover:border-gray-400 active:scale-[0.97] touch-manipulation">
                    ✗ Broke SOP
                  </div>
                </label>
              </div>
            )}
          />
          {(errors as any).sopFollowed && (
            <p className="mt-1 text-sm text-red-600">{String((errors as any).sopFollowed.message)}</p>
          )}
        </div>
        )}

        {/* SOP Type — TRANSACTION only */}
        {!isCommission && (
        <div>
          <Label htmlFor="sopTypeId" className="text-sm sm:text-base font-medium">SOP Type</Label>
          <select
            id="sopTypeId"
            {...register('sopTypeId')}
            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2.5 text-base min-h-[48px] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
            disabled={loadingSopTypes}
          >
            <option value="">Others (No specific SOP)</option>
            {sopTypes.map((sopType) => (
              <option key={sopType.id} value={sopType.id}>
                {sopType.name}
              </option>
            ))}
          </select>
          {sopTypes.length === 0 && !loadingSopTypes && (
            <p className="mt-1 text-xs text-gray-500">
              No SOP types configured. Contact admin to add SOP types.
            </p>
          )}
          {(errors as any).sopTypeId && (
            <p className="mt-1 text-sm text-red-600">{String((errors as any).sopTypeId.message)}</p>
          )}
        </div>
        )}

        {/* Symbol (Optional) */}
        <div>
          <Label htmlFor="symbol" className="text-sm sm:text-base font-medium">Symbol (Optional)</Label>
          <Input
            id="symbol"
            type="text"
            placeholder="e.g. EURUSD, GBPJPY"
            {...register('symbol')}
            className="mt-2 text-base uppercase min-h-[48px]"
            maxLength={10}
            onChange={(e) => {
              e.target.value = e.target.value.toUpperCase();
            }}
          />
          <p className="mt-1 text-xs text-gray-500">Trading pair or instrument (2-10 characters, uppercase)</p>
          {errors.symbol && (
            <p className="mt-1 text-sm text-red-600">{String(errors.symbol.message)}</p>
          )}
        </div>

        {/* Profit/Loss / Commission Amount */}
        <div>
          <Label htmlFor="profitLossUsd" className="text-sm sm:text-base font-medium">
            {isCommission ? 'Commission Amount (USD) *' : 'Amount (USD) *'}
          </Label>
          {isBreakEven ? (
            <div className="mt-2 flex items-center gap-2">
              <Input
                id="profitLossUsd"
                type="number"
                value={0}
                readOnly
                className="mt-0 text-base text-lg min-h-[48px] bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </div>
          ) : (
            <Input
              id="profitLossUsd"
              type="number"
              step="0.01"
              min="0"
              placeholder={isCommission ? 'e.g. 3.50' : 'e.g. 50.00'}
              {...register('profitLossUsd', { 
                valueAsNumber: true,
                onChange: () => debouncedValidation('profitLossUsd')
              })}
              className="mt-2 text-base text-lg min-h-[48px]"
            />
          )}
          <p className="mt-1 text-xs text-gray-500">
            {isCommission
              ? 'Enter the commission/swap fee as a positive number (e.g. 3.50)'
              : isBreakEven
              ? 'Break-even trade — amount is automatically $0.00'
              : 'Enter amount as positive number (auto-calculated based on WIN/LOSS)'}
          </p>
          {!isBreakEven && errors.profitLossUsd && (
            <p className="mt-1 text-sm text-red-600">{String(errors.profitLossUsd.message)}</p>
          )}
        </div>

        {/* Notes (Optional) */}
        <div>
          <Label htmlFor="notes" className="text-sm sm:text-base font-medium">Notes (Optional)</Label>
          <textarea
            id="notes"
            {...register('notes')}
            rows={4}
            maxLength={500}
            placeholder="Any observations, patterns, or learnings..."
            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-3 text-base min-h-[100px] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation resize-y"
          />
          {errors.notes && (
            <p className="mt-1 text-sm text-red-600">{String(errors.notes.message)}</p>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 min-h-[52px] text-base sm:text-lg font-semibold touch-manipulation"
          >
          {isSubmitting ? 'Recording...' : isCommission ? '💳 Record Commission' : '🚀 Record Trade'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/trades')}
            className="sm:w-auto min-h-[52px] touch-manipulation"
          >
            View All Trades
          </Button>
        </div>
      </form>
      
      {/* Badge Celebration Animation */}
      <BadgeCelebration 
        badges={earnedBadges}
        isOpen={showCelebration}
        onClose={() => {
          setShowCelebration(false);
          setEarnedBadges([]);
        }}
      />
    </div>
  );
}
