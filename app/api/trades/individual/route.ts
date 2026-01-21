/**
 * API Routes: /api/trades/individual
 * GET - List trades with filters
 * POST - Create a single trade
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createTrade, getTrades } from '@/lib/services/individualTradeService';
import { individualTradeApiSchema } from '@/lib/validations';
import { ZodError } from 'zod';
import { checkAndAwardBadges } from '@/lib/services/badgeService';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const filters: any = {
      userId: session.user.id,
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '50'),
    };

    // Optional filters
    if (searchParams.get('startDate')) {
      filters.startDate = new Date(searchParams.get('startDate')!);
    }
    if (searchParams.get('endDate')) {
      filters.endDate = new Date(searchParams.get('endDate')!);
    }
    if (searchParams.get('result')) {
      filters.result = searchParams.get('result') as 'WIN' | 'LOSS';
    }
    if (searchParams.get('marketSessions')) {
      filters.marketSessions = searchParams.get('marketSessions')!.split(',') as Array<'ASIA' | 'EUROPE' | 'US' | 'ASIA_EUROPE_OVERLAP' | 'EUROPE_US_OVERLAP'>;
    } else if (searchParams.get('marketSession')) {
      // Backward compatibility
      filters.marketSession = searchParams.get('marketSession') as 'ASIA' | 'EUROPE' | 'US' | 'ASIA_EUROPE_OVERLAP' | 'EUROPE_US_OVERLAP';
    }
    if (searchParams.get('sopFollowed')) {
      filters.sopFollowed = searchParams.get('sopFollowed') === 'true';
    }
    if (searchParams.get('minProfitLoss')) {
      filters.minProfitLoss = parseFloat(searchParams.get('minProfitLoss')!);
    }
    if (searchParams.get('maxProfitLoss')) {
      filters.maxProfitLoss = parseFloat(searchParams.get('maxProfitLoss')!);
    }

    // Get trades
    const result = await getTrades(filters);

    return NextResponse.json(
      { success: true, data: result },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/trades/individual]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

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
    const validatedData = individualTradeApiSchema.parse(body);

    // Create trade
    const trade = await createTrade({
      userId: session.user.id,
      tradeTimestamp: new Date(validatedData.tradeTimestamp),
      result: validatedData.result,
      sopFollowed: validatedData.sopFollowed,
      sopTypeId: validatedData.sopTypeId,
      symbol: validatedData.symbol,
      profitLossUsd: validatedData.profitLossUsd,
      notes: validatedData.notes,
    });
    
    // Check and award badges after trade creation
    let newBadges: any[] = [];
    try {
      newBadges = await checkAndAwardBadges(session.user.id, 'TRADE_INSERT');
    } catch (badgeError) {
      // Don't fail trade creation if badge check fails
      console.error('Badge check error (non-fatal):', badgeError);
    }
    
    return NextResponse.json(
      { 
        success: true, 
        data: trade, 
        badges: newBadges, // Include earned badges in response
        message: 'Trade created successfully' 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('=== API ERROR ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error:', error);
    
    if (error instanceof ZodError) {
      console.error('Zod validation errors:', error.issues);
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.issues[0].message, details: error.issues } },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      // Business logic errors (from service layer)
      if (error.message.includes('cannot exceed') || error.message.includes('cannot be')) {
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

    console.error('[POST /api/trades/individual]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
