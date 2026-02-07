/**
 * Quotes API
 * GET /api/quotes - Get all quotes (filtered)
 * POST /api/quotes - Create a new quote (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAllQuotes, createQuote, getQuoteStats } from '@/lib/services/quoteService';
import { createQuoteSchema } from '@/lib/validations/quote';
import { z } from 'zod';

// Query params schema
const querySchema = z.object({
  category: z.enum(['discipline', 'loss', 'win', 'patience', 'confidence', 'overtrading', 'risk', 'mental', 'general']).optional(),
  enabled: z.string().optional().transform((val) => val === 'true'),
  stats: z.string().optional().transform((val) => val === 'true'),
});

/**
 * GET /api/quotes
 * Get all quotes with optional filtering
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(req.url);
    const validation = querySchema.safeParse({
      category: searchParams.get('category'),
      enabled: searchParams.get('enabled'),
      stats: searchParams.get('stats'),
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: validation.error.format(),
          },
        },
        { status: 400 }
      );
    }

    const { category, enabled, stats } = validation.data;

    // If stats requested (admin only)
    if (stats) {
      if (session.user.role !== 'ADMIN') {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
          { status: 403 }
        );
      }

      const quoteStats = await getQuoteStats();
      return NextResponse.json({
        success: true,
        data: quoteStats,
      });
    }

    // Get quotes
    const quotes = await getAllQuotes({ category, enabled });

    return NextResponse.json({
      success: true,
      data: { quotes },
    });

  } catch (error) {
    console.error('[Quotes API Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch quotes',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/quotes
 * Create a new quote (admin only)
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Check admin role
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = createQuoteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid quote data',
            details: validation.error.format(),
          },
        },
        { status: 400 }
      );
    }

    // Create quote
    const quote = await createQuote(validation.data);

    return NextResponse.json(
      {
        success: true,
        data: { quote },
        message: 'Quote created successfully',
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('[Quotes API Error]', error);
    
    // Check for unique constraint violation (duplicate ID)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'SQLITE_CONSTRAINT') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_ID',
            message: 'Quote ID already exists',
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create quote',
        },
      },
      { status: 500 }
    );
  }
}
