'use client';

import { Input } from '@/components/ui/input';
import { DollarSign } from 'lucide-react';

interface TP3InputProps {
  value: number;
  onChange: (value: number) => void;
  isVisible: boolean;
}

export function TP3Input({ value, onChange, isVisible }: TP3InputProps) {
  if (!isVisible) {
    return <div className="h-10 flex items-center justify-center text-sm text-muted-foreground">-</div>;
  }

  return (
    <div className="relative">
      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="pl-8 h-10 text-emerald-600 font-medium"
        placeholder="0.00"
      />
    </div>
  );
}
