/**
 * API Route: POST /api/trades/bulk
 * Create multiple trades at once (end-of-day workflow)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createTradesBulk } from '@/lib/services/individualTradeService';
import { bulkTradeEntrySchema } from '@/lib/validations';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = bulkTradeEntrySchema.parse(body);

    // Validate all trades are on the same date
    const tradeDate = new Date(validatedData.tradeDate).toISOString().split('T')[0];
    const allSameDate = validatedData.trades.every(trade => {
      const timestamp = new Date(trade.tradeTimestamp);
      return timestamp.toISOString().split('T')[0] === tradeDate;
    });

    if (!allSameDate) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'All trades must be on the same date' } },
        { status: 400 }
      );
    }

    // Check for duplicate timestamps
    const timestamps = validatedData.trades.map(t => new Date(t.tradeTimestamp).toISOString());
    const uniqueTimestamps = new Set(timestamps);
    if (timestamps.length !== uniqueTimestamps.size) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Duplicate trade timestamps detected' } },
        { status: 400 }
      );
    }

    // Prepare trades for bulk insert
    const trades = validatedData.trades.map(trade => ({
      userId: session.user.id,
      tradeTimestamp: new Date(trade.tradeTimestamp),
      result: trade.result,
      sopFollowed: trade.sopFollowed,
      profitLossUsd: trade.profitLossUsd,
      notes: trade.notes,
    }));

    // Bulk create trades
    const result = await createTradesBulk(trades);

    return NextResponse.json(
      { success: true, data: result, message: `${result.count} trades created successfully` },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.issues[0].message, details: error.issues } },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      // Business logic errors
      if (error.message.includes('Cannot insert more than') || error.message.includes('must belong to same user')) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: error.message } },
          { status: 400 }
        );
      }

      // Database errors (generic)
      if (error.message.toLowerCase().includes('database') || error.message.toLowerCase().includes('unique constraint')) {
        return NextResponse.json(
          { success: false, error: { code: 'DATABASE_ERROR', message: 'Database operation failed' } },
          { status: 500 }
        );
      }
    }

    console.error('[POST /api/trades/bulk]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
