import type { DisciplineTrackerRow, DisciplineTrackerSettings } from '@/lib/db/schema';
import type { TradeOutcome } from '@/lib/validations/disciplineTracker';

/**
 * Result of evaluating a single day's row
 */
export interface DayEvaluation {
  allowedTrade2: boolean;
  allowedTrade3: boolean;
  lockReasonTrade2: string;
  lockReasonTrade3: string;
  dayPnl: number;
  wins: number;
  losses: number;
  bes: number;
  totalTrades: number;
  trade1Color: string;
  trade2Color: string;
  trade3Color: string;
}

/**
 * Aggregated statistics across multiple rows
 */
export interface AggregatedStats {
  totalPnl: number;
  totalWins: number;
  totalLosses: number;
  totalBE: number;
  totalTrades: number;
  winRate: number; // 0-100 percentage
}

/**
 * Extended row with evaluation results
 */
export interface EvaluatedRow extends DisciplineTrackerRow {
  evaluation: DayEvaluation;
}

/**
 * Outcome classification
 */
export type OutcomeType = 'win' | 'loss' | 'be' | 'empty';

/**
 * Color palette for outcomes
 */
export const OUTCOME_COLORS = {
  empty: '!bg-white border-gray-300',
  TP3: '!bg-emerald-50 border-emerald-400 text-emerald-900',
  TP2: '!bg-green-50 border-green-400 text-green-900',
  TP1: '!bg-lime-50 border-lime-400 text-lime-900',
  BE: '!bg-amber-50 border-amber-400 text-amber-900',
  SL: '!bg-rose-50 border-rose-400 text-rose-900',
  disabled: '!bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed opacity-50',
} as const;

/**
 * Helper to determine outcome type
 */
export function classifyOutcome(outcome: TradeOutcome | null | undefined): OutcomeType {
  if (!outcome || outcome === 'EMPTY') return 'empty';
  if (outcome === 'TP1' || outcome === 'TP2' || outcome === 'TP3') return 'win';
  if (outcome === 'SL') return 'loss';
  if (outcome === 'BE') return 'be';
  return 'empty';
}

/**
 * Helper to get P&L for an outcome
 */
export function getOutcomePnl(
  outcome: TradeOutcome | null | undefined,
  settings: DisciplineTrackerSettings,
  tp3Amount?: number | null
): number {
  if (!outcome || outcome === 'EMPTY') return 0;
  
  switch (outcome) {
    case 'SL':
      return settings.slValue;
    case 'BE':
      return settings.beValue;
    case 'TP1':
      return settings.tp1Value;
    case 'TP2':
      return settings.tp2Value;
    case 'TP3':
      if (settings.tp3Mode === 'manual') {
        return tp3Amount || 0;
      } else {
        return settings.tp3FixedValue || 0;
      }
    default:
      return 0;
  }
}
