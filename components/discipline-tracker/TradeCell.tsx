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

export function TradeCell({
  value,
  onChange,
  isLocked,
  lockReason,
  cellColor,
  tradeNumber,
}: TradeCellProps) {
  if (isLocked && (!value || value === '' || value === 'EMPTY')) {
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
            cellColor,
            isLocked && 'cursor-not-allowed opacity-50'
          )}
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
      {isLocked && value && value !== '' && value !== 'EMPTY' && (
        <div className="absolute -top-1 -right-1 bg-gray-700 rounded-full p-0.5">
          <Lock className="h-3 w-3 text-white" />
        </div>
      )}
    </div>
  );
}
