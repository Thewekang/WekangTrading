/**
 * Trades Page Quote API
 * GET /api/quotes/trades-page - Get a weighted quote based on last 3 trades + weekly performance
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTradesPageQuote } from '@/lib/services/tradesPageQuoteService';
import { incrementQuoteDisplayCount } from '@/lib/services/quoteService';

/**
 * GET /api/quotes/trades-page
 * Get a contextual quote for trades page
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

    const userId = session.user.id;

    // Get trades page quote
    const result = await getTradesPageQuote(userId);

    // Increment display count for analytics (if quote exists)
    if (result.quote?.id) {
      await incrementQuoteDisplayCount(result.quote.id);
    }

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('[Trades Page Quote API Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}
