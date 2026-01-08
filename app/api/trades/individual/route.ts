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
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

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
    if (searchParams.get('marketSession')) {
      filters.marketSession = searchParams.get('marketSession') as 'ASIA' | 'EUROPE' | 'US' | 'OVERLAP';
    }
    if (searchParams.get('sopFollowed')) {
      filters.sopFollowed = searchParams.get('sopFollowed') === 'true';
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
    console.log('=== API POST /api/trades/individual START ===');
    
    // Check authentication
    const session = await auth();
    console.log('Session:', session?.user ? { id: session.user.id, email: session.user.email } : 'No session');
    
    if (!session?.user) {
      console.log('Unauthorized - no session');
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    console.log('Request body received:', body);
    console.log('Body types:', {
      tradeTimestamp: typeof body.tradeTimestamp,
      result: typeof body.result,
      sopFollowed: typeof body.sopFollowed,
      profitLossUsd: typeof body.profitLossUsd,
    });
    
    console.log('Validating with individualTradeApiSchema...');
    const validatedData = individualTradeApiSchema.parse(body);
    console.log('Validation successful:', validatedData);

    // Create trade
    console.log('Creating trade for user:', session.user.id);
    const trade = await createTrade({
      userId: session.user.id,
      tradeTimestamp: new Date(validatedData.tradeTimestamp),
      result: validatedData.result,
      sopFollowed: validatedData.sopFollowed,
      profitLossUsd: validatedData.profitLossUsd,
      notes: validatedData.notes,
    });

    console.log('Trade created successfully:', trade);
    console.log('=== API POST /api/trades/individual END (SUCCESS) ===');
    
    return NextResponse.json(
      { success: true, data: trade, message: 'Trade created successfully' },
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
    }

    if (error instanceof PrismaClientKnownRequestError) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: 'Database operation failed' } },
        { status: 500 }
      );
    }

    console.error('[POST /api/trades/individual]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
