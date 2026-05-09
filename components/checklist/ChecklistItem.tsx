'use client';

import { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ItemState } from '@/lib/validations';

interface ChecklistItemProps {
  itemKey: string;
  label: string;
  description: string;
  state: ItemState;
  dynamicContent?: React.ReactNode;
  readOnly?: boolean;
  onToggle: (key: string) => void;
  onRemarkChange: (key: string, remark: string) => void;
}

const MAX_REMARK = 300;

export function ChecklistItem({
  itemKey,
  label,
  description,
  state,
  dynamicContent,
  readOnly = false,
  onToggle,
  onRemarkChange,
}: ChecklistItemProps) {
  const [remarkOpen, setRemarkOpen] = useState(false);
  const { checked, remark = '' } = state;

  return (
    <div
      className={cn(
        'rounded-lg border p-3 transition-colors',
        checked
          ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-800/60 dark:bg-emerald-950/30'
          : 'border-border bg-card',
      )}
    >
      {/* Main row */}
      <div className="flex items-start gap-3">
        {/* Checkbox — 44px min tap target */}
        <button
          type="button"
          onClick={() => !readOnly && onToggle(itemKey)}
          disabled={readOnly}
          aria-checked={checked}
          role="checkbox"
          className={cn(
            'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 transition-all',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            checked
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : 'border-muted-foreground/40 bg-background hover:border-emerald-400',
            readOnly && 'cursor-default opacity-60',
          )}
        >
          {checked && (
            <svg viewBox="0 0 12 9" className="h-3 w-3 fill-none stroke-current stroke-2">
              <polyline points="1 4.5 4.5 8 11 1" />
            </svg>
          )}
        </button>

        {/* Labels */}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'text-sm font-medium leading-snug',
              checked ? 'text-emerald-700 line-through opacity-75 dark:text-emerald-400' : 'text-foreground',
            )}
          >
            {label}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>

          {/* Dynamic content injected by parent (news / session) */}
          {dynamicContent && (
            <div className="mt-2">{dynamicContent}</div>
          )}
        </div>

        {/* Remark toggle button */}
        {!readOnly && (
          <button
            type="button"
            onClick={() => setRemarkOpen((v) => !v)}
            title={remarkOpen ? 'Hide remark' : remark ? 'Edit remark' : 'Add remark'}
            className={cn(
              'mt-0.5 shrink-0 rounded p-1 text-muted-foreground transition-colors hover:text-foreground',
              (remark || remarkOpen) && 'text-primary',
            )}
          >
            {remarkOpen ? <X className="h-3.5 w-3.5" /> : <MessageSquare className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {/* Remark textarea */}
      {remarkOpen && !readOnly && (
        <div className="mt-2 pl-9">
          <textarea
            value={remark}
            onChange={(e) => onRemarkChange(itemKey, e.target.value)}
            maxLength={MAX_REMARK}
            rows={2}
            placeholder="Add a note for this item…"
            className={cn(
              'w-full resize-none rounded border border-input bg-background px-2.5 py-1.5',
              'text-xs text-foreground placeholder:text-muted-foreground/60',
              'focus:outline-none focus:ring-1 focus:ring-ring',
            )}
          />
          <p className="mt-0.5 text-right text-[10px] text-muted-foreground">
            {remark.length}/{MAX_REMARK}
          </p>
        </div>
      )}

      {/* Collapsed remark preview */}
      {!remarkOpen && remark && (
        <p className="mt-1.5 pl-9 text-xs italic text-muted-foreground line-clamp-1">
          &ldquo;{remark}&rdquo;
        </p>
      )}
    </div>
  );
}
