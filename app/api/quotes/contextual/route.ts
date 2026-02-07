/**
 * Contextual Quote API
 * GET /api/quotes/contextual - Get a weighted quote based on trading performance
 * 
 * Returns a quote biased towards categories relevant to user's recent trading context
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getContextualQuote } from '@/lib/services/contextualQuoteService';
import { incrementQuoteDisplayCount } from '@/lib/services/quoteService';

/**
 * GET /api/quotes/contextual
 * Get a contextual quote based on trading performance
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

    // Get contextual quote
    const result = await getContextualQuote(userId);

    // Increment display count for analytics (if quote exists)
    if (result.quote?.id) {
      await incrementQuoteDisplayCount(result.quote.id);
    }

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('[Contextual Quote API Error]', error);
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
