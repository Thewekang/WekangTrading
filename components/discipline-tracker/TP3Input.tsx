'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { DollarSign } from 'lucide-react';

interface TP3InputProps {
  value: number;
  onChange: (value: number) => void;
  isVisible: boolean;
}

export function TP3Input({ value, onChange, isVisible }: TP3InputProps) {
  const [localValue, setLocalValue] = useState<string>(value.toString());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update local value when prop value changes externally
  useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!isVisible) {
    return <div className="h-10 flex items-center justify-center text-sm text-muted-foreground">-</div>;
  }

  const handleChange = (inputValue: string) => {
    // Update local state immediately for responsive UI
    setLocalValue(inputValue);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout to save after 500ms of no typing
    timeoutRef.current = setTimeout(() => {
      const numericValue = parseFloat(inputValue);
      // If empty or invalid, save as 0
      onChange(isNaN(numericValue) ? 0 : numericValue);
    }, 500);
  };

  return (
    <div className="relative">
      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="number"
        step="0.01"
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        className="pl-8 h-10 text-emerald-600 font-medium"
        placeholder="0.00"
      />
    </div>
  );
}
