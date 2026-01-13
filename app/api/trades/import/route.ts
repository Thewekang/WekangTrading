/**
 * API Route: /api/trades/import
 * POST - Import multiple trades from CSV
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { individualTrades, sopTypes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { calculateMarketSession } from '@/lib/utils/marketSessions';
import { updateDailySummary } from '@/lib/services/dailySummaryService';

interface ImportTradeInput {
  tradeTimestamp: string; // ISO string
  result: 'WIN' | 'LOSS';
  sopFollowed: boolean;
  sopTypeName: string;
  profitLossUsd: number;
  symbol?: string;
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { trades } = body as { trades: ImportTradeInput[] };

    if (!trades || !Array.isArray(trades)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request: trades array required' },
        { status: 400 }
      );
    }

    // Validate max limit
    if (trades.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No trades to import' },
        { status: 400 }
      );
    }

    if (trades.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Maximum 500 trades per import' },
        { status: 400 }
      );
    }

    // Validate all timestamps are valid dates
    const invalidDates = trades.filter(t => isNaN(new Date(t.tradeTimestamp).getTime()));
    if (invalidDates.length > 0) {
      return NextResponse.json(
        { success: false, error: `Invalid dates found in ${invalidDates.length} trades` },
        { status: 400 }
      );
    }

    // Check for future dates
    const now = new Date();
    const futureTrades = trades.filter(t => new Date(t.tradeTimestamp) > now);
    if (futureTrades.length > 0) {
      return NextResponse.json(
        { success: false, error: `${futureTrades.length} trades have future dates` },
        { status: 400 }
      );
    }

    // Check for duplicate timestamps within the import
    const timestamps = trades.map(t => new Date(t.tradeTimestamp).getTime());
    const uniqueTimestamps = new Set(timestamps);
    if (timestamps.length !== uniqueTimestamps.size) {
      return NextResponse.json(
        { success: false, error: 'Duplicate timestamps found in import file' },
        { status: 400 }
      );
    }

    // Check for existing trades with same timestamps
    const existingTrades = await db
      .select({ tradeTimestamp: individualTrades.tradeTimestamp })
      .from(individualTrades)
      .where(eq(individualTrades.userId, session.user.id));

    const existingTimestampSet = new Set(
      existingTrades.map(t => t.tradeTimestamp.getTime())
    );

    const duplicates = trades.filter(t =>
      existingTimestampSet.has(new Date(t.tradeTimestamp).getTime())
    );

    if (duplicates.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `${duplicates.length} trades already exist with the same timestamps`,
          duplicates: duplicates.map(d => d.tradeTimestamp),
        },
        { status: 400 }
      );
    }

    // Get or create SOP types
    const uniqueSopTypeNames = [...new Set(trades.map(t => t.sopTypeName).filter(Boolean))];
    const sopTypeMap = new Map<string, string>();

    // Get existing SOP types (SOP types are global, not user-specific)
    if (uniqueSopTypeNames.length > 0) {
      const existingSopTypes = await db
        .select()
        .from(sopTypes);

      // Build map of existing types
      for (const sopType of existingSopTypes) {
        sopTypeMap.set(sopType.name.toLowerCase(), sopType.id);
      }

      // Create new SOP types if needed (only if they don't exist globally)
      for (const sopTypeName of uniqueSopTypeNames) {
        const normalizedName = sopTypeName.toLowerCase();
        if (!sopTypeMap.has(normalizedName)) {
          // Create new SOP type (global, no userId)
          const [newSopType] = await db
            .insert(sopTypes)
            .values({
              name: sopTypeName,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();

          sopTypeMap.set(normalizedName, newSopType.id);
        }
      }
    }

    // Prepare trades for insertion
    const tradesToInsert = trades.map(trade => {
      const tradeTimestamp = new Date(trade.tradeTimestamp);
      const sopTypeId = trade.sopTypeName
        ? sopTypeMap.get(trade.sopTypeName.toLowerCase()) || null
        : null;

      return {
        userId: session.user.id,
        tradeTimestamp,
        marketSession: calculateMarketSession(tradeTimestamp),
        result: trade.result,
        sopFollowed: trade.sopFollowed,
        sopTypeId,
        symbol: trade.symbol || null,
        profitLossUsd: trade.profitLossUsd,
        notes: trade.notes || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    // Batch insert all trades
    await db.insert(individualTrades).values(tradesToInsert);

    // Recalculate daily summaries for affected dates
    const uniqueDates = [
      ...new Set(
        tradesToInsert.map(t => t.tradeTimestamp.toISOString().split('T')[0])
      ),
    ];

    for (const dateStr of uniqueDates) {
      await updateDailySummary(session.user.id, new Date(dateStr));
    }

    return NextResponse.json(
      {
        success: true,
        imported: tradesToInsert.length,
        datesAffected: uniqueDates.length,
        message: `Successfully imported ${tradesToInsert.length} trades`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/trades/import]', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
