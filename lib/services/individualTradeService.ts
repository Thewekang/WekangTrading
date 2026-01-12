/**
 * Individual Trade Service Layer
 * All business logic for trade operations
 */

import { db } from '../db';
import { individualTrades, sopTypes } from '../db/schema';
import { eq, and, desc, gte, lte, inArray, count } from 'drizzle-orm';
import { calculateMarketSession } from '../utils/marketSessions';
import { updateDailySummary } from './dailySummaryService';
import { VALIDATION, PAGINATION } from '../constants';

interface CreateTradeInput {
  userId: string;
  tradeTimestamp: Date;
  result: 'WIN' | 'LOSS';
  sopFollowed: boolean;
  sopTypeId?: string | null;
  symbol?: string;
  profitLossUsd: number;
  notes?: string;
}

interface UpdateTradeInput {
  tradeTimestamp?: Date;
  result?: 'WIN' | 'LOSS';
  sopFollowed?: boolean;
  sopTypeId?: string | null;
  symbol?: string;
  profitLossUsd?: number;
  notes?: string;
}

interface GetTradesFilters {
  userId: string;
  startDate?: Date;
  endDate?: Date;
  result?: 'WIN' | 'LOSS';
  marketSession?: 'ASIA' | 'EUROPE' | 'US' | 'ASIA_EUROPE_OVERLAP' | 'EUROPE_US_OVERLAP';
  marketSessions?: Array<'ASIA' | 'EUROPE' | 'US' | 'ASIA_EUROPE_OVERLAP' | 'EUROPE_US_OVERLAP'>;
  sopFollowed?: boolean;
  minProfitLoss?: number;
  maxProfitLoss?: number;
  page?: number;
  pageSize?: number;
}

/**
 * Create a new individual trade
 * Auto-calculates market session and updates daily summary
 */
export async function createTrade(input: CreateTradeInput) {
  // Calculate market session from timestamp
  const marketSession = calculateMarketSession(input.tradeTimestamp);

  // Validate notes length
  if (input.notes && input.notes.length > VALIDATION.MAX_NOTE_LENGTH) {
    throw new Error(`Notes cannot exceed ${VALIDATION.MAX_NOTE_LENGTH} characters`);
  }

  // Validate profit/loss is non-zero
  if (input.profitLossUsd === 0) {
    throw new Error('Profit/loss cannot be zero');
  }

  // Validate timestamp is not in future
  if (input.tradeTimestamp > new Date()) {
    throw new Error('Trade timestamp cannot be in the future');
  }

  // Create trade
  const [trade] = await db
    .insert(individualTrades)
    .values({
      userId: input.userId,
      tradeTimestamp: input.tradeTimestamp,
      result: input.result,
      sopFollowed: input.sopFollowed,
      sopTypeId: input.sopTypeId || null,
      symbol: input.symbol || null,
      profitLossUsd: input.profitLossUsd,
      marketSession,
      notes: input.notes || null,
    })
    .returning();

  // Update daily summary for this date
  await updateDailySummary(input.userId, input.tradeTimestamp);

  return trade;
}

/**
 * Bulk create trades (for end-of-day entry)
 * More efficient than creating one by one
 */
export async function createTradesBulk(trades: CreateTradeInput[]) {
  // Validate bulk size
  if (trades.length > PAGINATION.MAX_BULK_INSERT) {
    throw new Error(`Cannot insert more than ${PAGINATION.MAX_BULK_INSERT} trades at once`);
  }

  // Validate all trades are for same user
  const userIds = new Set(trades.map(t => t.userId));
  if (userIds.size > 1) {
    throw new Error('All trades in bulk insert must belong to same user');
  }

  const userId = trades[0].userId;

  // Calculate market sessions and prepare data
  const tradesWithSessions = trades.map(trade => ({
    userId: trade.userId,
    tradeTimestamp: trade.tradeTimestamp,
    result: trade.result,
    sopFollowed: trade.sopFollowed,
    sopTypeId: trade.sopTypeId || null,
    symbol: trade.symbol || null,
    profitLossUsd: trade.profitLossUsd,
    marketSession: calculateMarketSession(trade.tradeTimestamp),
    notes: trade.notes || null,
  }));

  // Bulk insert
  await db
    .insert(individualTrades)
    .values(tradesWithSessions);

  // Update daily summaries for all affected dates
  const uniqueDates = new Set(trades.map(t => t.tradeTimestamp.toISOString().split('T')[0]));
  for (const dateStr of uniqueDates) {
    await updateDailySummary(userId, new Date(dateStr));
  }

  return { count: trades.length };
}

/**
 * Get trades with filters and pagination
 */
export async function getTrades(filters: GetTradesFilters) {
  const {
    userId,
    startDate,
    endDate,
    result,
    marketSession,
    marketSessions,
    sopFollowed,
    minProfitLoss,
    maxProfitLoss,
    page = 1,
    pageSize = PAGINATION.PAGINATION_PAGE_SIZE,
  } = filters;

  // Build where conditions
  const conditions: any[] = [eq(individualTrades.userId, userId)];

  if (startDate) {
    conditions.push(gte(individualTrades.tradeTimestamp, startDate));
  }
  if (endDate) {
    conditions.push(lte(individualTrades.tradeTimestamp, endDate));
  }
  if (result) {
    conditions.push(eq(individualTrades.result, result));
  }
  
  // Handle multi-select sessions
  if (marketSessions && marketSessions.length > 0) {
    conditions.push(inArray(individualTrades.marketSession, marketSessions));
  } else if (marketSession) {
    // Backward compatibility
    conditions.push(eq(individualTrades.marketSession, marketSession));
  }
  
  if (sopFollowed !== undefined) {
    conditions.push(eq(individualTrades.sopFollowed, sopFollowed));
  }
  
  // Handle P/L range filters
  if (minProfitLoss !== undefined) {
    conditions.push(gte(individualTrades.profitLossUsd, minProfitLoss));
  }
  if (maxProfitLoss !== undefined) {
    conditions.push(lte(individualTrades.profitLossUsd, maxProfitLoss));
  }

  const whereCondition = conditions.length > 1 ? and(...conditions) : conditions[0];

  // Execute queries in parallel
  const [tradeResults, countResults, allFilteredTrades] = await Promise.all([
    // Get paginated trades with SOP type
    db
      .select({
        id: individualTrades.id,
        userId: individualTrades.userId,
        dailySummaryId: individualTrades.dailySummaryId,
        sopTypeId: individualTrades.sopTypeId,
        tradeTimestamp: individualTrades.tradeTimestamp,
        result: individualTrades.result,
        sopFollowed: individualTrades.sopFollowed,
        symbol: individualTrades.symbol,
        profitLossUsd: individualTrades.profitLossUsd,
        marketSession: individualTrades.marketSession,
        notes: individualTrades.notes,
        createdAt: individualTrades.createdAt,
        updatedAt: individualTrades.updatedAt,
        sopType: {
          id: sopTypes.id,
          name: sopTypes.name,
        },
      })
      .from(individualTrades)
      .leftJoin(sopTypes, eq(individualTrades.sopTypeId, sopTypes.id))
      .where(whereCondition)
      .orderBy(desc(individualTrades.tradeTimestamp))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    
    // Get total count
    db
      .select({ count: count() })
      .from(individualTrades)
      .where(whereCondition),
    
    // Get all trades for summary statistics (only fetch needed fields)
    db
      .select({
        result: individualTrades.result,
        sopFollowed: individualTrades.sopFollowed,
        profitLossUsd: individualTrades.profitLossUsd,
      })
      .from(individualTrades)
      .where(whereCondition),
  ]);

  const totalCount = countResults[0].count;

  // Calculate summary statistics from ALL filtered trades
  const totalWins = allFilteredTrades.filter(t => t.result === 'WIN').length;
  const totalSopFollowed = allFilteredTrades.filter(t => t.sopFollowed).length;
  const netProfitLoss = allFilteredTrades.reduce((sum, t) => sum + t.profitLossUsd, 0);
  const winRate = totalCount > 0 ? (totalWins / totalCount) * 100 : 0;
  const sopRate = totalCount > 0 ? (totalSopFollowed / totalCount) * 100 : 0;

  return {
    trades: tradeResults,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    },
    summary: {
      totalTrades: totalCount,
      totalWins,
      totalLosses: totalCount - totalWins,
      totalSopFollowed,
      netProfitLoss,
      winRate,
      sopRate,
    },
  };
}

/**
 * Get single trade by ID
 */
export async function getTradeById(id: string, userId: string) {
  const [trade] = await db
    .select()
    .from(individualTrades)
    .where(and(
      eq(individualTrades.id, id),
      eq(individualTrades.userId, userId)
    ))
    .limit(1);

  if (!trade) {
    throw new Error('Trade not found');
  }

  return trade;
}

/**
 * Update an existing trade
 */
export async function updateTrade(id: string, userId: string, input: UpdateTradeInput) {
  // Check trade exists and belongs to user
  const existingTrade = await getTradeById(id, userId);

  // Prepare update data
  const updateData: any = {};

  if (input.tradeTimestamp) {
    // Recalculate market session if timestamp changed
    updateData.tradeTimestamp = input.tradeTimestamp;
    updateData.marketSession = calculateMarketSession(input.tradeTimestamp);

    // Validate not in future
    if (input.tradeTimestamp > new Date()) {
      throw new Error('Trade timestamp cannot be in the future');
    }
  }

  if (input.result) updateData.result = input.result;
  if (input.sopFollowed !== undefined) updateData.sopFollowed = input.sopFollowed;
  if (input.profitLossUsd !== undefined) {
    if (input.profitLossUsd === 0) {
      throw new Error('Profit/loss cannot be zero');
    }
    updateData.profitLossUsd = input.profitLossUsd;
  }
  if (input.notes !== undefined) {
    if (input.notes && input.notes.length > VALIDATION.MAX_NOTE_LENGTH) {
      throw new Error(`Notes cannot exceed ${VALIDATION.MAX_NOTE_LENGTH} characters`);
    }
    updateData.notes = input.notes || null;
  }

  if (input.sopTypeId !== undefined) {
    updateData.sopTypeId = input.sopTypeId || null;
  }

  if (input.symbol !== undefined) {
    updateData.symbol = input.symbol || null;
  }

  // Update trade
  const [updatedTrade] = await db
    .update(individualTrades)
    .set(updateData)
    .where(eq(individualTrades.id, id))
    .returning();

  // Update daily summaries (old date and new date if changed)
  await updateDailySummary(userId, existingTrade.tradeTimestamp);
  if (input.tradeTimestamp && input.tradeTimestamp.toDateString() !== existingTrade.tradeTimestamp.toDateString()) {
    await updateDailySummary(userId, input.tradeTimestamp);
  }

  return updatedTrade;
}

/**
 * Delete a trade
 * Users can only delete trades created within 24 hours
 */
export async function deleteTrade(id: string, userId: string, isAdmin: boolean = false) {
  // Check trade exists and belongs to user
  const trade = await getTradeById(id, userId);

  // Check 24-hour window for regular users
  if (!isAdmin) {
    const hoursSinceCreation = (Date.now() - trade.createdAt.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceCreation > 24) {
      throw new Error('Trades can only be deleted within 24 hours of creation. Contact admin for assistance.');
    }
  }

  // Delete trade
  await db
    .delete(individualTrades)
    .where(eq(individualTrades.id, id));

  // Update daily summary for this date
  await updateDailySummary(userId, trade.tradeTimestamp);

  return { success: true };
}
