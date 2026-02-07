/**
 * Contextual Quote Service
 * Provides weighted quote selection based on user's trading performance context
 */

import { db } from '@/lib/db';
import { individualTrades } from '@/lib/db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { getRandomQuote } from './quoteService';
import type { QuoteCategory } from '@/lib/validations/quote';

interface TradingContext {
  recentWinRate: number;
  consecutiveLosses: number;
  consecutiveWins: number;
  totalRecentTrades: number;
  isOnLosingStreak: boolean;
  isOnWinningStreak: boolean;
}

/**
 * Analyze user's recent trading performance (last 20 trades)
 */
async function analyzeTradingContext(userId: string): Promise<TradingContext> {
  // Get last 20 trades
  const recentTrades = await db
    .select({
      result: individualTrades.result,
      timestamp: individualTrades.tradeTimestamp,
    })
    .from(individualTrades)
    .where(eq(individualTrades.userId, userId))
    .orderBy(desc(individualTrades.tradeTimestamp))
    .limit(20);

  if (recentTrades.length === 0) {
    return {
      recentWinRate: 0,
      consecutiveLosses: 0,
      consecutiveWins: 0,
      totalRecentTrades: 0,
      isOnLosingStreak: false,
      isOnWinningStreak: false,
    };
  }

  // Calculate win rate
  const wins = recentTrades.filter(t => t.result === 'WIN').length;
  const recentWinRate = (wins / recentTrades.length) * 100;

  // Calculate consecutive streaks (from most recent)
  let consecutiveLosses = 0;
  let consecutiveWins = 0;

  for (const trade of recentTrades) {
    if (trade.result === 'LOSS') {
      consecutiveLosses++;
      if (consecutiveWins > 0) break; // Stop if we hit a win after counting losses
    } else if (trade.result === 'WIN') {
      consecutiveWins++;
      if (consecutiveLosses > 0) break; // Stop if we hit a loss after counting wins
    }
  }

  return {
    recentWinRate,
    consecutiveLosses,
    consecutiveWins,
    totalRecentTrades: recentTrades.length,
    isOnLosingStreak: consecutiveLosses >= 2,
    isOnWinningStreak: consecutiveWins >= 3,
  };
}

/**
 * Get weighted category distribution based on trading context
 */
function getContextualCategoryWeights(context: TradingContext): QuoteCategory[] {
  const categories: QuoteCategory[] = [];

  // If on losing streak (2+ consecutive losses or win rate < 40%)
  if (context.isOnLosingStreak || context.recentWinRate < 40) {
    // Heavy bias towards discipline/patience/loss recovery
    categories.push(
      'discipline', 'discipline', 'discipline', // 3x weight
      'patience', 'patience', 'patience', // 3x weight
      'loss', 'loss', // 2x weight
      'mental', 'mental', // 2x weight
      'overtrading', // 1x weight
      'risk', // 1x weight
      'confidence' // 1x small boost
    );
  }
  // If on winning streak (3+ consecutive wins or win rate > 60%)
  else if (context.isOnWinningStreak || context.recentWinRate > 60) {
    // Moderate bias towards confidence/risk management (avoid overconfidence)
    categories.push(
      'win', 'win', // 2x weight - celebrate success
      'confidence', 'confidence', // 2x weight - build on momentum
      'discipline', 'discipline', // 2x weight - maintain discipline
      'risk', // 1x weight - manage risk in winning streak
      'patience', // 1x weight - don't force trades
      'mental', // 1x weight
      'general' // 1x weight
    );
  }
  // Neutral performance (40-60% win rate, no strong streaks)
  else {
    // Balanced distribution
    categories.push(
      'discipline', 'discipline', // 2x weight - always important
      'confidence', // 1x weight
      'patience', // 1x weight
      'mental', // 1x weight
      'risk', // 1x weight
      'general', // 1x weight
      'win', // 1x weight
      'loss' // 1x weight
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
        recentWinRate: context.recentWinRate,
        streak: context.isOnLosingStreak 
          ? `${context.consecutiveLosses} loss${context.consecutiveLosses > 1 ? 'es' : ''}`
          : context.isOnWinningStreak
          ? `${context.consecutiveWins} wins`
          : 'neutral',
        totalRecentTrades: context.totalRecentTrades,
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
        recentWinRate: 0,
        streak: 'unknown',
        totalRecentTrades: 0,
      },
    };
  }
}
