'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { RefreshCw, CalendarDays } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { CHECKLIST_PHASES, CHECKLIST_TOTAL } from '@/lib/constants';
import { ChecklistPhase } from './ChecklistPhase';
import type { ItemStates } from '@/lib/validations';
import type { TradingDayChecklist as TradingDayChecklistRow } from '@/lib/db/schema/checklist';
import type { EconomicEvent } from '@/lib/db/schema/economicEvents';
import type { MarketSession } from '@/lib/utils/marketSessions';

// ── Types ──────────────────────────────────────────────────────────────────

interface Props {
  accountId: string;
  initialChecklist: Omit<TradingDayChecklistRow, 'itemStates'> & { itemStates: ItemStates };
  initialNewsEvents: EconomicEvent[];
  initialSession: MarketSession | null;
  tradeDate: string;
  isToday: boolean;
}

// ── Toast trigger logic ────────────────────────────────────────────────────

function getPhaseKeys(phaseId: string): string[] {
  return CHECKLIST_PHASES.find((p) => p.id === phaseId)?.items.map((i) => i.key) ?? [];
}

function isPhaseComplete(phaseId: string, states: ItemStates): boolean {
  return getPhaseKeys(phaseId).every((k) => states[k]?.checked);
}

function countChecked(states: ItemStates): number {
  return Object.values(states).filter((s) => s.checked).length;
}

function triggerContextualMessages(
  prev: ItemStates,
  next: ItemStates,
  newsEvents: EconomicEvent[],
  phase1WasComplete: React.MutableRefObject<boolean>,
  allDoneToasted: React.MutableRefObject<boolean>,
) {
  const prevCount = countChecked(prev);
  const nextCount = countChecked(next);
  if (nextCount <= prevCount) return; // only fire on check, not uncheck

  // Phase 1 completion
  if (!phase1WasComplete.current && isPhaseComplete('pre_market', next)) {
    phase1WasComplete.current = true;
    toast.success("Pre-market complete — you're set up for today's session 🎯");
    return;
  }

  // Ticking Phase 2 items before Phase 1 is done
  const phase2Keys = getPhaseKeys('trade_setup');
  const justTickedPhase2 = phase2Keys.find((k) => !prev[k]?.checked && next[k]?.checked);
  if (justTickedPhase2 && !isPhaseComplete('pre_market', next)) {
    toast.warning("Heads up — pre-market checklist isn't done yet");
  }

  // entry_firm_decision ticked but mental_check unchecked
  if (!prev['entry_firm_decision']?.checked && next['entry_firm_decision']?.checked) {
    if (!next['mental_check']?.checked) {
      toast.error('You entered a trade without completing the mental check');
    }
  }

  // mental_check ticked after entry_firm_decision was already done
  if (!prev['mental_check']?.checked && next['mental_check']?.checked) {
    if (prev['entry_firm_decision']?.checked) {
      toast.warning('Mental check came after entry — try doing this earlier tomorrow');
    }
  }

  // trades_logged ticked
  if (!prev['trades_logged']?.checked && next['trades_logged']?.checked) {
    toast.info('Journal done. Consider noting what you\'d do differently tomorrow.');
  }

  // Phase 3 all done
  if (!isPhaseComplete('trade_management', prev) && isPhaseComplete('trade_management', next)) {
    toast.success('Trade management locked in. Stick to the plan! 💪');
  }

  // All 18 done
  if (!allDoneToasted.current && nextCount === CHECKLIST_TOTAL) {
    allDoneToasted.current = true;
    toast.success('🏆 Full checklist complete! Disciplined trading is the real edge.', { duration: 6000 });
  }
}

// ── Component ──────────────────────────────────────────────────────────────

const DEBOUNCE_MS = 600;

export function TradingDayChecklist({
  accountId,
  initialChecklist,
  initialNewsEvents,
  initialSession,
  tradeDate,
  isToday,
}: Props) {
  const [itemStates, setItemStates] = useState<ItemStates>(initialChecklist.itemStates);
  const [currentSession] = useState<MarketSession | null>(initialSession);
  const [saving, setSaving] = useState(false);

  const prevStatesRef = useRef<ItemStates>(initialChecklist.itemStates);
  const phase1WasComplete = useRef(isPhaseComplete('pre_market', initialChecklist.itemStates));
  const allDoneToasted = useRef(countChecked(initialChecklist.itemStates) === CHECKLIST_TOTAL);
  const newsAlertedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── News proximity alert (fires once per mount if news is within 15 min) ──
  useEffect(() => {
    if (!isToday || newsAlertedRef.current || initialNewsEvents.length === 0) return;

    const checkNewsProximity = () => {
      const now = Date.now();
      const soonMs = 15 * 60 * 1000;
      const upcoming = initialNewsEvents.find((ev) => {
        const t = ev.eventDate instanceof Date ? ev.eventDate.getTime() : new Date(ev.eventDate).getTime();
        return t > now && t - now <= soonMs;
      });
      if (upcoming && !newsAlertedRef.current) {
        const diffMin = Math.round(
          ((upcoming.eventDate instanceof Date
            ? upcoming.eventDate.getTime()
            : new Date(upcoming.eventDate).getTime()) -
            now) /
            60000,
        );
        toast.error(`🚨 High-impact news in ~${diffMin}m — no trades recommended`);
        newsAlertedRef.current = true;
      }
    };

    checkNewsProximity();
    const interval = setInterval(checkNewsProximity, 60_000);
    return () => clearInterval(interval);
  }, [isToday, initialNewsEvents]);

  // ── Debounced save ──────────────────────────────────────────────────────
  const saveToApi = useCallback(
    async (states: ItemStates) => {
      setSaving(true);
      try {
        await fetch(`/api/trading-accounts/${accountId}/checklist`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: tradeDate, itemStates: states }),
        });
      } catch {
        toast.error('Failed to save checklist — please try again');
      } finally {
        setSaving(false);
      }
    },
    [accountId, tradeDate],
  );

  const scheduleAutoSave = useCallback(
    (states: ItemStates) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => saveToApi(states), DEBOUNCE_MS);
    },
    [saveToApi],
  );

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleToggle = useCallback(
    (key: string) => {
      setItemStates((prev) => {
        const next: ItemStates = {
          ...prev,
          [key]: { ...prev[key], checked: !(prev[key]?.checked ?? false) },
        };
        triggerContextualMessages(prev, next, initialNewsEvents, phase1WasComplete, allDoneToasted);
        prevStatesRef.current = next;
        scheduleAutoSave(next);
        return next;
      });
    },
    [initialNewsEvents, scheduleAutoSave],
  );

  const handleRemarkChange = useCallback(
    (key: string, remark: string) => {
      setItemStates((prev) => {
        const next: ItemStates = {
          ...prev,
          [key]: { ...prev[key], remark },
        };
        scheduleAutoSave(next);
        return next;
      });
    },
    [scheduleAutoSave],
  );

  // ── Reset ───────────────────────────────────────────────────────────────
  const handleReset = async () => {
    try {
      const res = await fetch(
        `/api/trading-accounts/${accountId}/checklist?date=${tradeDate}`,
        { method: 'DELETE' },
      );
      if (!res.ok) throw new Error('Reset failed');
      const { data } = await res.json();
      const fresh: ItemStates = data.itemStates;
      setItemStates(fresh);
      prevStatesRef.current = fresh;
      phase1WasComplete.current = false;
      allDoneToasted.current = false;
      toast.info('Checklist reset. Clean slate 🔄');
    } catch {
      toast.error('Failed to reset checklist');
    }
  };

  // ── Progress ─────────────────────────────────────────────────────────────
  const checkedCount = countChecked(itemStates);
  const progressPct = Math.round((checkedCount / CHECKLIST_TOTAL) * 100);

  const readOnly = !isToday;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          <span>{tradeDate}</span>
          {readOnly && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">Read-only</span>
          )}
          {saving && (
            <span className="animate-pulse text-xs text-muted-foreground">Saving…</span>
          )}
        </div>

        {isToday && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Reset for Today
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset today&apos;s checklist?</AlertDialogTitle>
                <AlertDialogDescription>
                  All items will be unchecked and remarks cleared. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Overall progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">
            {checkedCount} of {CHECKLIST_TOTAL} items done
          </span>
          <span
            className={cn(
              'font-semibold tabular-nums',
              progressPct === 100 ? 'text-emerald-600' : 'text-muted-foreground',
            )}
          >
            {progressPct}%
          </span>
        </div>
        <Progress value={progressPct} className="h-2" />
      </div>

      {/* Phase sections */}
      {CHECKLIST_PHASES.map((phase) => (
        <ChecklistPhase
          key={phase.id}
          phase={phase}
          itemStates={itemStates}
          newsEvents={initialNewsEvents}
          currentSession={currentSession}
          readOnly={readOnly}
          onToggle={handleToggle}
          onRemarkChange={handleRemarkChange}
        />
      ))}
    </div>
  );
}
