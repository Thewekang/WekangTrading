'use client';

import { DollarSign } from 'lucide-react';

interface OutcomeValueDisplayProps {
  value: number;
  isVisible: boolean;
  outcome: 'TP3' | 'TP2' | 'TP1' | 'BE' | 'SL';
}

const OUTCOME_COLORS = {
  TP3: 'text-emerald-600',
  TP2: 'text-green-600',
  TP1: 'text-lime-600',
  BE: 'text-amber-600',
  SL: 'text-rose-600',
};

export function OutcomeValueDisplay({ value, isVisible, outcome }: OutcomeValueDisplayProps) {
  if (!isVisible) {
    return <div className="h-10 flex items-center justify-center text-sm text-muted-foreground">-</div>;
  }

  const colorClass = OUTCOME_COLORS[outcome];
  const sign = value >= 0 ? '+' : '';

  return (
    <div className="relative h-10 flex items-center px-3 rounded-md border border-border bg-muted/30">
      <DollarSign className="h-4 w-4 text-muted-foreground mr-2" />
      <span className={`font-medium ${colorClass} flex-1`}>
        {sign}{value.toFixed(2)}
      </span>
      <span className="text-xs text-muted-foreground">(auto)</span>
    </div>
  );
}
