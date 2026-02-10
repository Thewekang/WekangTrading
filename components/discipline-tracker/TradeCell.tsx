'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lock } from 'lucide-react';
import type { TradeOutcome } from '@/lib/validations/disciplineTracker';
import { cn } from '@/lib/utils';

interface TradeCellProps {
  value: TradeOutcome;
  onChange: (value: TradeOutcome) => void;
  isLocked: boolean;
  lockReason?: string;
  cellColor: string;
  tradeNumber: 1 | 2 | 3;
}

// Color mapping for inline styles to ensure background colors always show
const OUTCOME_STYLES: Record<TradeOutcome, { bg: string; border: string; text: string }> = {
  '': { bg: '#ffffff', border: '#d1d5db', text: '#111827' }, // Empty string (same as EMPTY)
  EMPTY: { bg: '#ffffff', border: '#d1d5db', text: '#111827' },
  TP3: { bg: '#ecfdf5', border: '#34d399', text: '#064e3b' },
  TP2: { bg: '#f0fdf4', border: '#4ade80', text: '#14532d' },
  TP1: { bg: '#f7fee7', border: '#a3e635', text: '#365314' },
  BE: { bg: '#fffbeb', border: '#fbbf24', text: '#78350f' },
  SL: { bg: '#fef2f2', border: '#f87171', text: '#7f1d1d' },
};

export function TradeCell({
  value,
  onChange,
  isLocked,
  lockReason,
  cellColor,
  tradeNumber,
}: TradeCellProps) {
  if (isLocked && (!value || value === 'EMPTY')) {
    // Locked and empty - show lock icon
    return (
      <div
        className={cn(
          'flex items-center justify-center h-10 rounded-md border-2',
          'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed opacity-50'
        )}
        title={lockReason || 'Locked'}
      >
        <Lock className="h-4 w-4" />
      </div>
    );
  }

  const outcomeStyle = OUTCOME_STYLES[value] || OUTCOME_STYLES.EMPTY;

  return (
    <div className="relative">
      <Select
        value={value}
        onValueChange={onChange}
        disabled={isLocked}
      >
        <SelectTrigger
          className={cn(
            'h-10 border-2 font-medium',
            isLocked && 'cursor-not-allowed opacity-50'
          )}
          style={{
            backgroundColor: outcomeStyle.bg,
            borderColor: outcomeStyle.border,
            color: outcomeStyle.text,
          }}
          title={isLocked ? lockReason : undefined}
        >
          <SelectValue placeholder={`Trade ${tradeNumber}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="EMPTY" className="text-gray-500">
            Empty
          </SelectItem>
          <SelectItem value="TP3" className="text-emerald-700 font-medium">
            TP3 (Win)
          </SelectItem>
          <SelectItem value="TP2" className="text-green-700 font-medium">
            TP2 (Win)
          </SelectItem>
          <SelectItem value="TP1" className="text-lime-700 font-medium">
            TP1 (Win)
          </SelectItem>
          <SelectItem value="BE" className="text-amber-700 font-medium">
            BE (Breakeven)
          </SelectItem>
          <SelectItem value="SL" className="text-rose-700 font-medium">
            SL (Loss)
          </SelectItem>
        </SelectContent>
      </Select>
      {isLocked && value && value !== 'EMPTY' && (
        <div className="absolute -top-1 -right-1 bg-gray-700 rounded-full p-0.5">
          <Lock className="h-3 w-3 text-white" />
        </div>
      )}
    </div>
  );
}
