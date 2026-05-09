'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChecklistItem } from './ChecklistItem';
import type { ChecklistPhaseDef } from '@/lib/constants';
import type { ItemStates, ItemState } from '@/lib/validations';
import type { EconomicEvent } from '@/lib/db/schema/economicEvents';
import type { MarketSession } from '@/lib/utils/marketSessions';

const SESSION_LABELS: Record<MarketSession, string> = {
  ASIA: '🌏 Asia',
  EUROPE: '🇪🇺 Europe',
  US: '🇺🇸 US',
  ASIA_EUROPE_OVERLAP: '🌍 Asia–Europe Overlap',
  EUROPE_US_OVERLAP: '🌐 Europe–US Overlap',
};

interface ChecklistPhaseProps {
  phase: ChecklistPhaseDef;
  itemStates: ItemStates;
  newsEvents: EconomicEvent[];
  currentSession: MarketSession | null;
  readOnly: boolean;
  onToggle: (key: string) => void;
  onRemarkChange: (key: string, remark: string) => void;
}

export function ChecklistPhase({
  phase,
  itemStates,
  newsEvents,
  currentSession,
  readOnly,
  onToggle,
  onRemarkChange,
}: ChecklistPhaseProps) {
  const [open, setOpen] = useState(true);

  const total = phase.items.length;
  const done = phase.items.filter((item) => itemStates[item.key]?.checked).length;
  const allDone = done === total;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      {/* Phase header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex w-full items-center gap-2 px-4 py-3 text-left transition-colors',
          'rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          open && 'rounded-b-none',
        )}
      >
        <span className="text-lg" aria-hidden>
          {phase.icon}
        </span>
        <span className="flex-1 font-semibold text-foreground">{phase.label}</span>

        {/* Progress chip */}
        {allDone ? (
          <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            All done
          </span>
        ) : (
          <Badge variant="outline" className="text-xs tabular-nums">
            {done}/{total}
          </Badge>
        )}

        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {/* Items list */}
      {open && (
        <div className="space-y-2 rounded-b-xl border-t border-border p-3">
          {phase.items.map((item) => {
            const state: ItemState = itemStates[item.key] ?? { checked: false, remark: '' };

            // Build dynamic content for special items
            let dynamicContent: React.ReactNode = null;

            if (item.dynamicType === 'news' && newsEvents.length > 0) {
              dynamicContent = (
                <div className="mt-1.5 space-y-1">
                  {newsEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs dark:border-red-900/50 dark:bg-red-950/30"
                    >
                      <span className="shrink-0 font-semibold text-red-600 dark:text-red-400">
                        🔴 {event.currency}
                      </span>
                      <span className="min-w-0 truncate text-muted-foreground">{event.eventName}</span>
                      <span className="ml-auto shrink-0 text-muted-foreground">
                        {event.eventDate instanceof Date
                          ? event.eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : ''}
                      </span>
                    </div>
                  ))}
                </div>
              );
            }

            if (item.dynamicType === 'news' && newsEvents.length === 0) {
              dynamicContent = (
                <p className="mt-1 rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                  ✅ No high-impact news today
                </p>
              );
            }

            if (item.dynamicType === 'session' && currentSession) {
              dynamicContent = (
                <p className="mt-1 rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                  {SESSION_LABELS[currentSession]}
                </p>
              );
            }

            return (
              <ChecklistItem
                key={item.key}
                itemKey={item.key}
                label={item.label}
                description={item.description}
                state={state}
                dynamicContent={dynamicContent}
                readOnly={readOnly}
                onToggle={onToggle}
                onRemarkChange={onRemarkChange}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
