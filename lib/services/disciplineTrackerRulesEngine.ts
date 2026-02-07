import type { DisciplineTrackerRow, DisciplineTrackerSettings } from '@/lib/db/schema';
import type { DayEvaluation, AggregatedStats } from '@/lib/types/disciplineTracker';
import { classifyOutcome, getOutcomePnl, OUTCOME_COLORS } from '@/lib/types/disciplineTracker';
import type { TradeOutcome } from '@/lib/validations/disciplineTracker';

/**
 * DISCIPLINE RULES ENGINE
 * 
 * This is the core logic that enforces trading discipline rules.
 * It evaluates each day's row and determines:
 * - Which trades are allowed
 * - Why trades are locked
 * - Daily P&L and statistics
 * - Cell colors for visual feedback
 * 
 * Rules are re-evaluated whenever:
 * - A trade outcome changes
 * - A toggle changes
 * - Settings change
 */

/**
 * Evaluate a single day's row
 * 
 * @param row - The discipline tracker row to evaluate
 * @param settings - The user's plan settings
 * @returns DayEvaluation with all computed values
 */
export function evaluateDayRow(
  row: DisciplineTrackerRow,
  settings: DisciplineTrackerSettings
): DayEvaluation {
  // Initialize evaluation result
  const evaluation: DayEvaluation = {
    allowedTrade2: false,
    allowedTrade3: false,
    lockReasonTrade2: '',
    lockReasonTrade3: '',
    dayPnl: 0,
    wins: 0,
    losses: 0,
    bes: 0,
    totalTrades: 0,
    trade1Color: OUTCOME_COLORS.empty,
    trade2Color: OUTCOME_COLORS.disabled,
    trade3Color: OUTCOME_COLORS.disabled,
  };

  // Extract trade outcomes
  const trade1 = row.trade1Outcome;
  const trade2 = row.trade2Outcome;
  const trade3 = row.trade3Outcome;

  // Classify outcomes
  const trade1Type = classifyOutcome(trade1);
  const trade2Type = classifyOutcome(trade2);
  const trade3Type = classifyOutcome(trade3);

  // Calculate P&L for each trade
  const trade1Pnl = getOutcomePnl(trade1, settings, row.trade1Tp3Amount);
  const trade2Pnl = getOutcomePnl(trade2, settings, row.trade2Tp3Amount);
  const trade3Pnl = getOutcomePnl(trade3, settings, row.trade3Tp3Amount);

  // Set colors for Trade 1
  if (trade1 && trade1 !== 'EMPTY') {
    evaluation.trade1Color = OUTCOME_COLORS[trade1];
  }

  // Count trades and outcomes
  if (trade1 && trade1 !== 'EMPTY') {
    evaluation.totalTrades++;
    evaluation.dayPnl += trade1Pnl;
    if (trade1Type === 'win') evaluation.wins++;
    if (trade1Type === 'loss') evaluation.losses++;
    if (trade1Type === 'be') evaluation.bes++;
  }

  // ============================================
  // TRADE 2 RULES
  // ============================================
  
  if (trade1 && trade1 !== 'EMPTY') {
    // Rule: If Trade 1 = TP1/TP2/TP3 → STOP (Trade 2 disabled)
    if (trade1Type === 'win') {
      evaluation.allowedTrade2 = false;
      evaluation.lockReasonTrade2 = '✓ Trade 1 was a win - STOP for the day';
    }
    // Rule: If Trade 1 = BE → Trade 2 allowed ONLY if A+ Confirmed
    else if (trade1Type === 'be') {
      if (row.isAPlusDay) {
        evaluation.allowedTrade2 = true;
        evaluation.lockReasonTrade2 = '';
      } else {
        evaluation.allowedTrade2 = false;
        evaluation.lockReasonTrade2 = 'Trade 1 BE - Need A+ Confirmed';
      }
    }
    // Rule: If Trade 1 = SL → Trade 2 allowed ONLY if A+ Confirmed
    else if (trade1Type === 'loss') {
      if (row.isAPlusDay) {
        evaluation.allowedTrade2 = true;
        evaluation.lockReasonTrade2 = '';
      } else {
        evaluation.allowedTrade2 = false;
        evaluation.lockReasonTrade2 = 'Trade 1 SL - Need A+ Confirmed';
      }
    }
  } else {
    // Trade 1 is empty - Trade 2 not allowed yet
    evaluation.allowedTrade2 = false;
    evaluation.lockReasonTrade2 = 'Complete Trade 1 first';
  }

  // Process Trade 2 if it exists
  if (trade2 && trade2 !== 'EMPTY') {
    evaluation.totalTrades++;
    evaluation.dayPnl += trade2Pnl;
    if (trade2Type === 'win') evaluation.wins++;
    if (trade2Type === 'loss') evaluation.losses++;
    if (trade2Type === 'be') evaluation.bes++;
    
    // Set color based on allowed status
    if (evaluation.allowedTrade2) {
      evaluation.trade2Color = OUTCOME_COLORS[trade2];
    } else {
      // Trade 2 exists but shouldn't - mark as error (will be shown in UI)
      evaluation.trade2Color = OUTCOME_COLORS.disabled;
    }
  } else if (evaluation.allowedTrade2) {
    // Trade 2 is empty but allowed
    evaluation.trade2Color = OUTCOME_COLORS.empty;
  }

  // ============================================
  // TRADE 3 RULES (RARE EXCEPTION)
  // ============================================
  
  // Default: Trade 3 is disabled
  evaluation.allowedTrade3 = false;
  evaluation.lockReasonTrade3 = 'Trade 3 rarely allowed';

  // Check if Trade 3 can be allowed
  if (trade1 && trade2 && trade1 !== 'EMPTY' && trade2 !== 'EMPTY') {
    // Rule: Trade 3 allowed ONLY IF ALL conditions met:
    // - Trade 1 = BE
    // - Trade 2 = BE
    // - No realized loss for the day (checked via losses count)
    // - Range Expansion Confirmed = true
    // - Session Window = Prime
    
    const isTrade1BE = trade1Type === 'be';
    const isTrade2BE = trade2Type === 'be';
    const noLosses = evaluation.losses === 0;
    const rangeExpansion = row.isRangeExpansionDay;
    const primeSession = row.sessionWindow === 'prime';

    if (!isTrade1BE || !isTrade2BE) {
      evaluation.lockReasonTrade3 = 'Trade 3 only if Trade 1 & 2 are both BE';
    } else if (!noLosses) {
      evaluation.lockReasonTrade3 = 'Trade 3 not allowed - realized loss detected';
    } else if (!rangeExpansion) {
      evaluation.lockReasonTrade3 = 'Trade 3 needs Range Expansion Confirmed';
    } else if (!primeSession) {
      evaluation.lockReasonTrade3 = 'Trade 3 only in Prime session';
    } else {
      // All conditions met!
      evaluation.allowedTrade3 = true;
      evaluation.lockReasonTrade3 = '';
    }
  } else if (!trade1 || trade1 === 'EMPTY') {
    evaluation.lockReasonTrade3 = 'Complete Trade 1 first';
  } else if (!trade2 || trade2 === 'EMPTY') {
    evaluation.lockReasonTrade3 = 'Complete Trade 2 first';
  }

  // Process Trade 3 if it exists
  if (trade3 && trade3 !== 'EMPTY') {
    evaluation.totalTrades++;
    evaluation.dayPnl += trade3Pnl;
    if (trade3Type === 'win') evaluation.wins++;
    if (trade3Type === 'loss') evaluation.losses++;
    if (trade3Type === 'be') evaluation.bes++;
    
    // Set color based on allowed status
    if (evaluation.allowedTrade3) {
      evaluation.trade3Color = OUTCOME_COLORS[trade3];
    } else {
      // Trade 3 exists but shouldn't - mark as error
      evaluation.trade3Color = OUTCOME_COLORS.disabled;
    }
  } else if (evaluation.allowedTrade3) {
    // Trade 3 is empty but allowed
    evaluation.trade3Color = OUTCOME_COLORS.empty;
  }

  // ============================================
  // TRADE 2 ADDITIONAL RULES (After Trade 2 outcome)
  // ============================================
  
  if (trade2 && trade2 !== 'EMPTY') {
    // Rule: If Trade 2 = TP1/TP2/TP3 → Trade 3 disabled
    if (trade2Type === 'win') {
      evaluation.allowedTrade3 = false;
      evaluation.lockReasonTrade3 = '✓ Trade 2 was a win - STOP for the day';
    }
    // Rule: If Trade 2 = SL → Trade 3 disabled
    else if (trade2Type === 'loss') {
      evaluation.allowedTrade3 = false;
      evaluation.lockReasonTrade3 = '✗ Trade 2 was a loss - STOP for the day';
    }
    // Rule: If Trade 2 = BE → STOP by default (already handled above, but re-emphasized)
    else if (trade2Type === 'be') {
      // Trade 3 logic already handled above with strict conditions
    }
  }

  return evaluation;
}

/**
 * Aggregate statistics across multiple rows
 * 
 * @param rows - Array of discipline tracker rows
 * @param settings - The user's plan settings
 * @returns AggregatedStats with cumulative totals
 */
export function aggregateRows(
  rows: DisciplineTrackerRow[],
  settings: DisciplineTrackerSettings
): AggregatedStats {
  const stats: AggregatedStats = {
    totalPnl: 0,
    totalWins: 0,
    totalLosses: 0,
    totalBE: 0,
    totalTrades: 0,
    winRate: 0,
  };

  // Evaluate each row and accumulate
  for (const row of rows) {
    const evaluation = evaluateDayRow(row, settings);
    stats.totalPnl += evaluation.dayPnl;
    stats.totalWins += evaluation.wins;
    stats.totalLosses += evaluation.losses;
    stats.totalBE += evaluation.bes;
    stats.totalTrades += evaluation.totalTrades;
  }

  // Calculate win rate based on formula
  if (settings.winRateFormula === 'excludeBE') {
    // Formula A: wins / (wins + losses)
    const denominator = stats.totalWins + stats.totalLosses;
    stats.winRate = denominator > 0 ? (stats.totalWins / denominator) * 100 : 0;
  } else {
    // Formula B: wins / (wins + losses + BE)
    const denominator = stats.totalWins + stats.totalLosses + stats.totalBE;
    stats.winRate = denominator > 0 ? (stats.totalWins / denominator) * 100 : 0;
  }

  return stats;
}

/**
 * Check if a specific trade change would violate rules
 * Used for validation before saving
 * 
 * @param row - The row being edited
 * @param tradeNumber - Which trade is being changed (1, 2, or 3)
 * @param newOutcome - The new outcome value
 * @param settings - The user's plan settings
 * @returns Object with isValid and reason
 */
export function validateTradeChange(
  row: DisciplineTrackerRow,
  tradeNumber: 1 | 2 | 3,
  newOutcome: TradeOutcome,
  settings: DisciplineTrackerSettings
): { isValid: boolean; reason: string } {
  // Create a temporary row with the proposed change
  const tempRow = { ...row };
  
  if (tradeNumber === 1) {
    tempRow.trade1Outcome = newOutcome;
  } else if (tradeNumber === 2) {
    tempRow.trade2Outcome = newOutcome;
  } else {
    tempRow.trade3Outcome = newOutcome;
  }

  // Evaluate the temporary row
  const evaluation = evaluateDayRow(tempRow, settings);

  // Check if the trade is allowed
  if (tradeNumber === 2 && !evaluation.allowedTrade2) {
    return {
      isValid: false,
      reason: evaluation.lockReasonTrade2 || 'Trade 2 not allowed',
    };
  }

  if (tradeNumber === 3 && !evaluation.allowedTrade3) {
    return {
      isValid: false,
      reason: evaluation.lockReasonTrade3 || 'Trade 3 not allowed',
    };
  }

  return { isValid: true, reason: '' };
}
