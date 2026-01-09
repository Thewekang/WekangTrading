/**
 * Individual Trade Service Layer
 * All business logic for trade operations
 */

import { prisma } from '../db';
import { calculateMarketSession } from '../utils/marketSessions';
import { updateDailySummary } from './dailySummaryService';
import { VALIDATION, PAGINATION } from '../constants';

interface CreateTradeInput {
  userId: string;
  tradeTimestamp: Date;
  result: 'WIN' | 'LOSS';
  sopFollowed: boolean;
  profitLossUsd: number;
  notes?: string;
}

interface UpdateTradeInput {
  tradeTimestamp?: Date;
  result?: 'WIN' | 'LOSS';
  sopFollowed?: boolean;
  profitLossUsd?: number;
  notes?: string;
}

interface GetTradesFilters {
  userId: string;
  startDate?: Date;
  endDate?: Date;
  result?: 'WIN' | 'LOSS';
  marketSession?: 'ASIA' | 'EUROPE' | 'US' | 'OVERLAP';
  marketSessions?: Array<'ASIA' | 'EUROPE' | 'US' | 'OVERLAP'>;
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
  const trade = await prisma.individualTrade.create({
    data: {
      userId: input.userId,
      tradeTimestamp: input.tradeTimestamp,
      result: input.result,
      sopFollowed: input.sopFollowed,
      profitLossUsd: input.profitLossUsd,
      marketSession,
      notes: input.notes || null,
    },
  });

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
    profitLossUsd: trade.profitLossUsd,
    marketSession: calculateMarketSession(trade.tradeTimestamp),
    notes: trade.notes || null,
  }));

  // Bulk insert
  await prisma.individualTrade.createMany({
    data: tradesWithSessions,
  });

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

  const where: any = { userId };

  if (startDate || endDate) {
    where.tradeTimestamp = {};
    if (startDate) where.tradeTimestamp.gte = startDate;
    if (endDate) where.tradeTimestamp.lte = endDate;
  }

  if (result) where.result = result;
  
  // Handle multi-select sessions
  if (marketSessions && marketSessions.length > 0) {
    where.marketSession = { in: marketSessions };
  } else if (marketSession) {
    // Backward compatibility
    where.marketSession = marketSession;
  }
  
  if (sopFollowed !== undefined) where.sopFollowed = sopFollowed;
  
  // Handle P/L range filters
  if (minProfitLoss !== undefined || maxProfitLoss !== undefined) {
    where.profitLossUsd = {};
    if (minProfitLoss !== undefined) where.profitLossUsd.gte = minProfitLoss;
    if (maxProfitLoss !== undefined) where.profitLossUsd.lte = maxProfitLoss;
  }

  const [trades, totalCount] = await Promise.all([
    prisma.individualTrade.findMany({
      where,
      orderBy: { tradeTimestamp: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.individualTrade.count({ where }),
  ]);

  return {
    trades,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    },
  };
}

/**
 * Get single trade by ID
 */
export async function getTradeById(id: string, userId: string) {
  const trade = await prisma.individualTrade.findFirst({
    where: { id, userId },
  });

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

  // Update trade
  const updatedTrade = await prisma.individualTrade.update({
    where: { id },
    data: updateData,
  });

  // Update daily summaries (old date and new date if changed)
  await updateDailySummary(userId, existingTrade.tradeTimestamp);
  if (input.tradeTimestamp && input.tradeTimestamp.toDateString() !== existingTrade.tradeTimestamp.toDateString()) {
    await updateDailySummary(userId, input.tradeTimestamp);
  }

  return updatedTrade;
}

/**
 * Delete a trade
 */
export async function deleteTrade(id: string, userId: string) {
  // Check trade exists and belongs to user
  const trade = await getTradeById(id, userId);

  // Delete trade
  await prisma.individualTrade.delete({
    where: { id },
  });

  // Update daily summary for this date
  await updateDailySummary(userId, trade.tradeTimestamp);

  return { success: true };
}
