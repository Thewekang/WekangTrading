/**
 * Trades Page Quote Service
 * Provides weighted quote selection based on recent trades (last 3) and weekly performance
 */

import { db } from '@/lib/db';
import { individualTrades } from '@/lib/db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { getRandomQuote } from './quoteService';
import type { QuoteCategory } from '@/lib/validations/quote';

interface TradesPageContext {
  lastThreeResults: ('WIN' | 'LOSS')[];
  weeklyWinRate: number;
  weeklyTotalTrades: number;
  recentMood: 'winning' | 'losing' | 'mixed' | 'new';
}

/**
 * Analyze user's last 3 trades and weekly performance
 * Optimized to use a single query with proper ordering
 */
async function analyzeTradesPageContext(userId: string): Promise<TradesPageContext> {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Single optimized query: Get weekly trades (includes last 3)
  const weeklyTrades = await db
    .select({
      result: individualTrades.result,
    })
    .from(individualTrades)
    .where(
      and(
        eq(individualTrades.userId, userId),
        gte(individualTrades.tradeTimestamp, oneWeekAgo)
      )
    )
    .orderBy(desc(individualTrades.tradeTimestamp))
    .all();

  // Extract last 3 from weekly data (no additional query needed), filter out nulls (COMMISSION entries)
  const lastThreeResults = weeklyTrades.slice(0, 3).map(t => t.result).filter((r): r is 'WIN' | 'LOSS' => r === 'WIN' || r === 'LOSS');
  const weeklyWins = weeklyTrades.filter(t => t.result === 'WIN').length;
  const weeklyWinRate = weeklyTrades.length > 0 ? (weeklyWins / weeklyTrades.length) * 100 : 0;

  // Determine mood based on last 3 trades
  let recentMood: 'winning' | 'losing' | 'mixed' | 'new' = 'new';
  
  if (lastThreeResults.length === 0) {
    recentMood = 'new';
  } else if (lastThreeResults.length >= 2) {
    const wins = lastThreeResults.filter(r => r === 'WIN').length;
    const losses = lastThreeResults.filter(r => r === 'LOSS').length;
    
    if (wins >= 2) {
      recentMood = 'winning';
    } else if (losses >= 2) {
      recentMood = 'losing';
    } else {
      recentMood = 'mixed';
    }
  }

  return {
    lastThreeResults,
    weeklyWinRate,
    weeklyTotalTrades: weeklyTrades.length,
    recentMood,
  };
}

/**
 * Get weighted category distribution based on trades page context
 */
function getTradesPageCategoryWeights(context: TradesPageContext): QuoteCategory[] {
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
 * Get a contextual quote for trades page based on last 3 trades + weekly performance
 */
export async function getTradesPageQuote(userId: string) {
  try {
    // Analyze context
    const context = await analyzeTradesPageContext(userId);

    // Get weighted category distribution
    const weightedCategories = getTradesPageCategoryWeights(context);

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
        lastThreeResults: context.lastThreeResults,
        weeklyWinRate: context.weeklyWinRate,
        weeklyTotalTrades: context.weeklyTotalTrades,
      },
    };
  } catch (error) {
    console.error('[Trades Page Quote Service Error]', error);
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
        lastThreeResults: [],
        weeklyWinRate: 0,
        weeklyTotalTrades: 0,
      },
    };
  }
}
