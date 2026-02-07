/**
 * Quote Service
 * Handles CRUD operations for trading quotes and weighted random selection
 */

import { db } from '@/lib/db';
import { tradingQuotes, users } from '@/lib/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import type { QuoteCategory } from '@/lib/validations/quote';
import { selectWeightedRandom, filterAntiRepeat } from '@/lib/utils/weightedRandom';

const ANTI_REPEAT_HISTORY = 10; // Don't repeat same quote within last 10 shows

// ============================================
// QUOTE RETRIEVAL
// ============================================

/**
 * Get all quotes (optionally filtered)
 */
export async function getAllQuotes(filters?: {
  enabled?: boolean;
  category?: QuoteCategory;
}) {
  let query = db.select().from(tradingQuotes);

  if (filters) {
    const conditions = [];
    if (filters.enabled !== undefined) {
      conditions.push(eq(tradingQuotes.enabled, filters.enabled));
    }
    if (filters.category) {
      conditions.push(eq(tradingQuotes.category, filters.category));
    }
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
  }

  return await query.orderBy(tradingQuotes.category, tradingQuotes.id).all();
}

/**
 * Get a single quote by ID
 */
export async function getQuoteById(id: string) {
  return await db.select()
    .from(tradingQuotes)
    .where(eq(tradingQuotes.id, id))
    .get();
}

/**
 * Get random quote with weighted selection and anti-repeat logic
 */
export async function getRandomQuote(options: {
  category?: QuoteCategory;
  userId?: string;
  antiRepeat?: boolean;
}): Promise<typeof tradingQuotes.$inferSelect | null> {
  const { category, userId, antiRepeat = true } = options;

  // Build query for enabled quotes
  const conditions = [eq(tradingQuotes.enabled, true)];
  if (category) {
    conditions.push(eq(tradingQuotes.category, category));
  }

  let availableQuotes = await db.select()
    .from(tradingQuotes)
    .where(and(...conditions))
    .all();

  if (availableQuotes.length === 0) return null;

  // Apply anti-repeat logic if userId provided
  if (antiRepeat && userId) {
    const user = await db.select({
      lastQuoteId: users.lastQuoteId,
    })
    .from(users)
    .where(eq(users.id, userId))
    .get();

    if (user?.lastQuoteId) {
      // Filter out last shown quote
      const filtered = availableQuotes.filter(q => q.id !== user.lastQuoteId);
      if (filtered.length > 0) {
        availableQuotes = filtered;
      }
    }
  }

  // Select using weighted random
  const selectedQuote = selectWeightedRandom(availableQuotes);
  
  return selectedQuote;
}

/**
 * Get "Quote of the Day" - same quote for 24 hours for all users
 * Uses daily seed for deterministic selection
 */
export async function getQuoteOfTheDay(): Promise<typeof tradingQuotes.$inferSelect | null> {
  // Get all enabled quotes
  const availableQuotes = await db.select()
    .from(tradingQuotes)
    .where(eq(tradingQuotes.enabled, true))
    .all();

  if (availableQuotes.length === 0) return null;

  // Use current date as seed for deterministic selection
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  
  // Deterministic "random" selection based on date
  const index = seed % availableQuotes.length;
  
  return availableQuotes[index];
}

// ============================================
// QUOTE MANAGEMENT (ADMIN)
// ============================================

/**
 * Create a new quote
 */
export async function createQuote(data: typeof tradingQuotes.$inferInsert) {
  const result = await db.insert(tradingQuotes).values(data).returning();
  return result[0];
}

/**
 * Update an existing quote
 */
export async function updateQuote(
  id: string,
  data: Partial<typeof tradingQuotes.$inferInsert>
) {
  const result = await db.update(tradingQuotes)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(tradingQuotes.id, id))
    .returning();
  
  return result[0];
}

/**
 * Delete a quote
 */
export async function deleteQuote(id: string) {
  await db.delete(tradingQuotes)
    .where(eq(tradingQuotes.id, id));
}

/**
 * Increment display count for a quote
 */
export async function incrementQuoteDisplayCount(id: string) {
  await db.update(tradingQuotes)
    .set({
      displayCount: sql`${tradingQuotes.displayCount} + 1`,
    })
    .where(eq(tradingQuotes.id, id));
}

// ============================================
// ANALYTICS
// ============================================

/**
 * Get quote statistics
 */
export async function getQuoteStats() {
  const allQuotes = await db.select().from(tradingQuotes).all();
  
  const stats = {
    total: allQuotes.length,
    enabled: allQuotes.filter(q => q.enabled).length,
    disabled: allQuotes.filter(q => !q.enabled).length,
    byCategory: {} as Record<string, number>,
    totalDisplays: allQuotes.reduce((sum, q) => sum + q.displayCount, 0),
    mostShown: allQuotes.sort((a, b) => b.displayCount - a.displayCount).slice(0, 5),
  };

  // Count by category
  allQuotes.forEach(quote => {
    stats.byCategory[quote.category] = (stats.byCategory[quote.category] || 0) + 1;
  });

  return stats;
}

/**
 * Reset all display counts (for testing/admin)
 */
export async function resetDisplayCounts() {
  await db.update(tradingQuotes)
    .set({ displayCount: 0 });
}
