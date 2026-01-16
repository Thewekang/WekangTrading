'use client';

/**
 * Real-Time Trade Entry Form
 * Mobile-optimized for quick entry during trading sessions
 */

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { individualTradeSchema, IndividualTradeInput } from '@/lib/validations';
import { BadgeCelebration } from '@/components/animations/BadgeCelebration';
import type { Badge } from '@/lib/db/schema';

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
    formState: { errors },
  } = useForm<IndividualTradeInput>({
    resolver: zodResolver(individualTradeSchema),
    defaultValues: {
      result: 'WIN',
      sopFollowed: undefined,
      sopTypeId: null,
      profitLossUsd: 0,
      notes: '',
    },
  });

  // Set timestamp after component mounts to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
    const now = new Date();
    setValue('tradeTimestamp', now);
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
      
      // Auto-negate for LOSS trades if user entered positive number
      if (data.result === 'LOSS' && profitLoss > 0) {
        profitLoss = -profitLoss;
      }
      // Auto-negate for WIN trades if user entered negative number
      if (data.result === 'WIN' && profitLoss < 0) {
        profitLoss = Math.abs(profitLoss);
      }
      
      const submitData = {
        tradeTimestamp: data.tradeTimestamp instanceof Date ? data.tradeTimestamp.toISOString() : new Date(data.tradeTimestamp).toISOString(),
        result: data.result,
        sopFollowed: data.sopFollowed,
        sopTypeId: data.sopTypeId || null,
        profitLossUsd: profitLoss,
        symbol: data.symbol || undefined,
        notes: data.notes || undefined,
      };

      const response = await fetch('/api/trades/individual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      console.log('Trade submission result:', result);
      console.log('Badges in response:', result.badges);

      if (!response.ok || !result.success) {
        setErrorMessage(result.error?.message || 'Failed to create trade');
        return;
      }
      
      // Check if badges were earned
      if (result.badges && result.badges.length > 0) {
        console.log('Setting earned badges:', result.badges);
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
        result: 'WIN',
        sopFollowed: undefined,
        sopTypeId: null,
        profitLossUsd: 0,
        notes: '',
      });
      
      // Set new timestamp after reset
      setValue('tradeTimestamp', new Date());

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
        <h2 className="text-2xl font-bold mb-2">🏍️💰 Quick Trade Entry</h2>
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
              {errors.tradeTimestamp && <li>Trade timestamp: {errors.tradeTimestamp.message}</li>}
              {errors.result && <li>Result: {errors.result.message}</li>}
              {errors.sopFollowed && <li>SOP Compliance: {errors.sopFollowed.message}</li>}
              {errors.profitLossUsd && <li>Profit/Loss: {errors.profitLossUsd.message}</li>}
              {errors.notes && <li>Notes: {errors.notes.message}</li>}
            </ul>
          </div>
        )}
        
        {/* Trade Timestamp */}
        <div>
          <Label htmlFor="tradeTimestamp">Trade Time *</Label>
          <Controller
            control={control}
            name="tradeTimestamp"
            render={({ field }) => (
              <Input
                id="tradeTimestamp"
                type="datetime-local"
                value={isClient && field.value instanceof Date ? formatDateForInput(field.value) : ''}
                onChange={(e) => field.onChange(new Date(e.target.value))}
                className="mt-1 text-base"
              />
            )}
          />
          {errors.tradeTimestamp && (
            <p className="mt-1 text-sm text-red-600">{errors.tradeTimestamp.message}</p>
          )}
        </div>

        {/* Result - Large Touch-Friendly Buttons */}
        <div>
          <Label>Result *</Label>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <label className="relative">
              <input
                type="radio"
                value="WIN"
                {...register('result')}
                className="peer sr-only"
              />
              <div className="min-h-[60px] flex items-center justify-center cursor-pointer rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-center font-semibold transition-all peer-checked:border-green-500 peer-checked:bg-green-50 peer-checked:text-green-700 hover:border-gray-400">
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
              <div className="min-h-[60px] flex items-center justify-center cursor-pointer rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-center font-semibold transition-all peer-checked:border-red-500 peer-checked:bg-red-50 peer-checked:text-red-700 hover:border-gray-400">
                ❌ LOSS
              </div>
            </label>
          </div>
          {errors.result && (
            <p className="mt-1 text-sm text-red-600">{errors.result.message}</p>
          )}
        </div>

        {/* SOP Followed */}
        <div>
          <Label>SOP Compliance *</Label>
          <Controller
            control={control}
            name="sopFollowed"
            rules={{ required: 'Please select whether you followed SOP or not' }}
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
                  <div className="min-h-[60px] flex items-center justify-center cursor-pointer rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-center font-semibold transition-all peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-700 hover:border-gray-400">
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
                  <div className="min-h-[60px] flex items-center justify-center cursor-pointer rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-center font-semibold transition-all peer-checked:border-orange-500 peer-checked:bg-orange-50 peer-checked:text-orange-700 hover:border-gray-400">
                    ✗ Broke SOP
                  </div>
                </label>
              </div>
            )}
          />
          {errors.sopFollowed && (
            <p className="mt-1 text-sm text-red-600">{errors.sopFollowed.message}</p>
          )}
        </div>

        {/* SOP Type */}
        <div>
          <Label htmlFor="sopTypeId">SOP Type</Label>
          <select
            id="sopTypeId"
            {...register('sopTypeId')}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
          {errors.sopTypeId && (
            <p className="mt-1 text-sm text-red-600">{errors.sopTypeId.message}</p>
          )}
        </div>

        {/* Symbol (Optional) */}
        <div>
          <Label htmlFor="symbol">Symbol (Optional)</Label>
          <Input
            id="symbol"
            type="text"
            placeholder="e.g. EURUSD, GBPJPY"
            {...register('symbol')}
            className="mt-1 text-base uppercase"
            maxLength={10}
            onChange={(e) => {
              e.target.value = e.target.value.toUpperCase();
            }}
          />
          <p className="mt-1 text-xs text-gray-500">Trading pair or instrument (2-10 characters, uppercase)</p>
          {errors.symbol && (
            <p className="mt-1 text-sm text-red-600">{errors.symbol.message}</p>
          )}
        </div>

        {/* Profit/Loss USD */}
        <div>
          <Label htmlFor="profitLossUsd">Amount (USD) *</Label>
          <Input
            id="profitLossUsd"
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g. 50.00"
            {...register('profitLossUsd', { valueAsNumber: true })}
            className="mt-1 text-base" // Larger text for mobile
          />
          <p className="mt-1 text-xs text-gray-500">Enter amount as positive number (auto-calculated based on WIN/LOSS)</p>
          {errors.profitLossUsd && (
            <p className="mt-1 text-sm text-red-600">{errors.profitLossUsd.message}</p>
          )}
        </div>

        {/* Notes (Optional) */}
        <div>
          <Label htmlFor="notes">Notes (Optional)</Label>
          <textarea
            id="notes"
            {...register('notes')}
            rows={3}
            maxLength={500}
            placeholder="Any observations, patterns, or learnings..."
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.notes && (
            <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 min-h-[50px] text-base font-semibold"
          >
            {isSubmitting ? 'Recording...' : '🚀 Record Trade'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/trades')}
            className="sm:w-auto min-h-[50px]"
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
