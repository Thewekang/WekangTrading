/**
 * Contextual Quote Service
 * Provides weighted quote selection based on user's Discipline Tracker performance
 */

import { db } from '@/lib/db';
import { disciplineTrackerRows } from '@/lib/db/schema/disciplineTracker';
import { eq, desc, and, gte } from 'drizzle-orm';
import { getRandomQuote } from './quoteService';
import type { QuoteCategory } from '@/lib/validations/quote';

interface TradingContext {
  lastThreeDays: Array<{
    date: Date;
    wins: number;
    losses: number;
    breakevens: number;
  }>;
  weeklyWinRate: number;
  weeklyTotalTrades: number;
  recentMood: 'winning' | 'losing' | 'mixed' | 'new';
}

/**
 * Analyze user's last 3 days and weekly performance from Discipline Tracker
 */
async function analyzeTradingContext(userId: string): Promise<TradingContext> {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get last 3 days from discipline tracker
  const lastThreeRows = await db
    .select()
    .from(disciplineTrackerRows)
    .where(eq(disciplineTrackerRows.userId, userId))
    .orderBy(desc(disciplineTrackerRows.tradeDate))
    .limit(3);

  // Get weekly rows
  const weeklyRows = await db
    .select()
    .from(disciplineTrackerRows)
    .where(
      and(
        eq(disciplineTrackerRows.userId, userId),
        gte(disciplineTrackerRows.tradeDate, oneWeekAgo)
      )
    )
    .all();

  // Helper function to determine if outcome is a win, loss, or breakeven
  const categorizeOutcome = (outcome: string) => {
    if (!outcome || outcome === '' || outcome === 'EMPTY') return null;
    if (outcome === 'SL') return 'loss';
    if (outcome === 'BE') return 'breakeven';
    if (outcome === 'TP1' || outcome === 'TP2' || outcome === 'TP3') return 'win';
    return null;
  };

  // Analyze last 3 days
  const lastThreeDays = lastThreeRows.map(row => {
    const outcomes = [
      categorizeOutcome(row.trade1Outcome || ''),
      categorizeOutcome(row.trade2Outcome || ''),
      categorizeOutcome(row.trade3Outcome || ''),
    ].filter(o => o !== null);

    return {
      date: row.tradeDate,
      wins: outcomes.filter(o => o === 'win').length,
      losses: outcomes.filter(o => o === 'loss').length,
      breakevens: outcomes.filter(o => o === 'breakeven').length,
    };
  });

  // Analyze weekly performance
  let weeklyWins = 0;
  let weeklyLosses = 0;
  let weeklyBreakevens = 0;

  weeklyRows.forEach(row => {
    const outcomes = [
      categorizeOutcome(row.trade1Outcome || ''),
      categorizeOutcome(row.trade2Outcome || ''),
      categorizeOutcome(row.trade3Outcome || ''),
    ].filter(o => o !== null);

    weeklyWins += outcomes.filter(o => o === 'win').length;
    weeklyLosses += outcomes.filter(o => o === 'loss').length;
    weeklyBreakevens += outcomes.filter(o => o === 'breakeven').length;
  });

  const weeklyTotalTrades = weeklyWins + weeklyLosses + weeklyBreakevens;
  const weeklyWinRate = weeklyTotalTrades > 0 ? (weeklyWins / weeklyTotalTrades) * 100 : 0;

  // Determine mood based on last 3 days
  let recentMood: 'winning' | 'losing' | 'mixed' | 'new' = 'new';

  if (lastThreeDays.length === 0) {
    recentMood = 'new';
  } else {
    // Count days with more wins vs losses
    let winningDays = 0;
    let losingDays = 0;

    lastThreeDays.forEach(day => {
      if (day.wins > day.losses) winningDays++;
      else if (day.losses > day.wins) losingDays++;
    });

    if (losingDays >= 2) {
      recentMood = 'losing';
    } else if (winningDays >= 2) {
      recentMood = 'winning';
    } else {
      recentMood = 'mixed';
    }
  }

  return {
    lastThreeDays,
    weeklyWinRate,
    weeklyTotalTrades,
    recentMood,
  };
}

/**
 * Get weighted category distribution based on trading context
 */
function getContextualCategoryWeights(context: TradingContext): QuoteCategory[] {
  const categories: QuoteCategory[] = [];

  // New trader or no recent trades
  if (context.recentMood === 'new' || context.weeklyTotalTrades === 0) {
    categories.push(
      'general', 'general', // 2x
      'discipline', 'discipline', // 2x
      'patience', // 1x
      'mental', // 1x
      'risk', // 1x
      'confidence' // 1x
    );
  }
  // Recent losing mood (2+ losses in last 3) OR poor weekly performance (<40%)
  else if (context.recentMood === 'losing' || context.weeklyWinRate < 40) {
    categories.push(
      'loss', 'loss', 'loss', // 3x - focus on recovery
      'patience', 'patience', 'patience', // 3x - slow down
      'discipline', 'discipline', // 2x - stick to plan
      'mental', 'mental', // 2x - mental game
      'risk', // 1x - risk management
      'overtrading', // 1x - avoid revenge trading
      'general' // 1x
    );
  }
  // Recent winning mood (2+ wins in last 3) OR strong weekly performance (>60%)
  else if (context.recentMood === 'winning' || context.weeklyWinRate > 60) {
    categories.push(
      'win', 'win', 'win', // 3x - celebrate success
      'confidence', 'confidence', // 2x - build momentum
      'discipline', 'discipline', // 2x - maintain edge
      'risk', 'risk', // 2x - don't get overconfident
      'patience', // 1x - wait for setups
      'general' // 1x
    );
  }
  // Mixed recent performance or neutral weekly (40-60%)
  else {
    categories.push(
      'discipline', 'discipline', 'discipline', // 3x - always key
      'general', 'general', // 2x
      'patience', // 1x
      'mental', // 1x
      'confidence', // 1x
      'risk', // 1x
      'loss', // 1x
      'win' // 1x
    );
  }

  return categories;
}

/**
 * Get a contextual quote based on user's trading performance
 * Uses weighted random selection biased towards relevant categories
 */
export async function getContextualQuote(userId: string) {
  try {
    // Analyze trading context
    const context = await analyzeTradingContext(userId);

    // Get weighted category distribution
    const weightedCategories = getContextualCategoryWeights(context);

    // Randomly select from weighted categories
    const randomIndex = Math.floor(Math.random() * weightedCategories.length);
    const selectedCategory = weightedCategories[randomIndex];

    // Get random quote from selected category
    const quote = await getRandomQuote({ 
      category: selectedCategory, 
      userId,
      antiRepeat: true,
    });

    return {
      quote,
      context: {
        category: selectedCategory,
        recentMood: context.recentMood,
        lastThreeDays: context.lastThreeDays.map(day => ({
          wins: day.wins,
          losses: day.losses,
          breakevens: day.breakevens,
        })),
        weeklyWinRate: context.weeklyWinRate,
        weeklyTotalTrades: context.weeklyTotalTrades,
      },
    };
  } catch (error) {
    console.error('[Contextual Quote Service Error]', error);
    // Fallback to general quote
    const quote = await getRandomQuote({ 
      category: 'general', 
      userId,
      antiRepeat: false,
    });
    return {
      quote,
      context: {
        category: 'general' as QuoteCategory,
        recentMood: 'new' as const,
        lastThreeDays: [],
        weeklyWinRate: 0,
        weeklyTotalTrades: 0,
      },
    };
  }
}
