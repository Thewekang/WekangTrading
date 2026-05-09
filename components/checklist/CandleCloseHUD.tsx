'use client';

import { useEffect, useRef, useState } from 'react';
import { Timer, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Candle interval definitions ─────────────────────────────────────────────

const CANDLES = [
  { label: '1m', seconds: 60 },
  { label: '15m', seconds: 15 * 60 },
  { label: '1h', seconds: 60 * 60 },
  { label: '4h', seconds: 4 * 60 * 60 },
] as const;

type CandleKey = (typeof CANDLES)[number]['label'];

// ── Helpers ──────────────────────────────────────────────────────────────────

function secondsUntilClose(intervalSec: number): number {
  const nowSec = Math.floor(Date.now() / 1000);
  const remainder = nowSec % intervalSec;
  return remainder === 0 ? 0 : intervalSec - remainder;
}

function formatCountdown(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m < 60) return `${m}m ${String(s).padStart(2, '0')}s`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return `${h}h ${String(rm).padStart(2, '0')}m`;
}

function colorClass(remaining: number, total: number): string {
  const ratio = remaining / total;
  if (ratio > 0.5) return 'text-emerald-500';
  if (ratio > 0.1) return 'text-yellow-500';
  return 'text-red-500';
}

// ── Component ─────────────────────────────────────────────────────────────────

const HUD_STORAGE_KEY = 'wekang_hud_minimised';

export function CandleCloseHUD() {
  const [minimised, setMinimised] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(HUD_STORAGE_KEY) === 'true';
  });

  const [countdowns, setCountdowns] = useState<Record<CandleKey, number>>(() => {
    const init: Partial<Record<CandleKey, number>> = {};
    for (const c of CANDLES) {
      init[c.label] = secondsUntilClose(c.seconds);
    }
    return init as Record<CandleKey, number>;
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const next: Partial<Record<CandleKey, number>> = {};
      for (const c of CANDLES) {
        next[c.label] = secondsUntilClose(c.seconds);
      }
      setCountdowns(next as Record<CandleKey, number>);
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const toggleMinimise = () => {
    setMinimised((v) => {
      const next = !v;
      localStorage.setItem(HUD_STORAGE_KEY, String(next));
      return next;
    });
  };

  if (minimised) {
    return (
      <button
        type="button"
        onClick={toggleMinimise}
        title="Expand candle close timer"
        className={cn(
          'fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center',
          'rounded-full border border-border bg-card shadow-lg',
          'text-muted-foreground transition-colors hover:text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
      >
        <Timer className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50 w-44',
        'rounded-xl border border-border bg-card/95 shadow-xl backdrop-blur-sm',
      )}
    >
      {/* Header */}
      <button
        type="button"
        onClick={toggleMinimise}
        className={cn(
          'flex w-full items-center justify-between rounded-t-xl px-3 py-2',
          'text-xs font-semibold uppercase tracking-wider text-muted-foreground',
          'hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'transition-colors',
        )}
      >
        <span className="flex items-center gap-1.5">
          <Timer className="h-3.5 w-3.5" />
          Candle Close
        </span>
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {/* Countdown rows */}
      <div className="divide-y divide-border/60 px-3 pb-2">
        {CANDLES.map((c) => {
          const rem = countdowns[c.label];
          const col = colorClass(rem, c.seconds);
          return (
            <div key={c.label} className="flex items-center justify-between py-1.5">
              <span className="text-xs font-medium text-muted-foreground">{c.label}</span>
              <span className={cn('tabular-nums text-xs font-semibold', col)}>
                {formatCountdown(rem)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
