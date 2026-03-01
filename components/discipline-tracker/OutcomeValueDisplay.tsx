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
    return null;
  }

  const colorClass = OUTCOME_COLORS[outcome];
  const sign = value >= 0 ? '+' : '';

  return (
    <div className="flex items-center gap-1.5 h-8 px-3 bg-muted/30 rounded-md border border-border/50">
      <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
      <span className={`text-sm font-medium ${colorClass}`}>
        {sign}{value.toFixed(2)}
      </span>
      <span className="text-xs text-muted-foreground ml-auto">(auto)</span>
    </div>
  );
}
