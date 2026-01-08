/**
 * API Routes: /api/trades/individual/[id]
 * GET - Get single trade
 * PATCH - Update trade
 * DELETE - Delete trade
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTradeById, updateTrade, deleteTrade } from '@/lib/services/individualTradeService';
import { ZodError } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const trade = await getTradeById(params.id, session.user.id);

    return NextResponse.json(
      { success: true, data: trade },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Trade not found') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Trade not found' } },
        { status: 404 }
      );
    }

    console.error('[GET /api/trades/individual/[id]]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Convert tradeTimestamp string to Date if present
    if (body.tradeTimestamp) {
      body.tradeTimestamp = new Date(body.tradeTimestamp);
    }

    // Update trade
    const trade = await updateTrade(params.id, session.user.id, body);

    return NextResponse.json(
      { success: true, data: trade, message: 'Trade updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Trade not found') {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Trade not found' } },
          { status: 404 }
        );
      }

      // Business logic errors
      if (error.message.includes('cannot exceed') || error.message.includes('cannot be')) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: error.message } },
          { status: 400 }
        );
      }
    }

    console.error('[PATCH /api/trades/individual/[id]]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    await deleteTrade(params.id, session.user.id);

    return NextResponse.json(
      { success: true, message: 'Trade deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Trade not found') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Trade not found' } },
        { status: 404 }
      );
    }

    console.error('[DELETE /api/trades/individual/[id]]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
