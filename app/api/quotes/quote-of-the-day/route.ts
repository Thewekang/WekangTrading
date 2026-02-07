/**
 * Quote of the Day API
 * GET /api/quotes/quote-of-the-day - Get the deterministic quote for today
 * 
 * Returns the same quote for all users for 24 hours
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getQuoteOfTheDay } from '@/lib/services/quoteService';

/**
 * GET /api/quotes/quote-of-the-day
 * Get today's quote (same for all users)
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

    // Get quote of the day
    const quote = await getQuoteOfTheDay();

    if (!quote) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_QUOTES_AVAILABLE',
            message: 'No quotes available',
          },
        },
        { status: 404 }
      );
    }

    // Get language preference from query params (default to English)
    const { searchParams } = new URL(req.url);
    const language = (searchParams.get('language') || 'en') as 'en' | 'bm';

    // Validate language
    if (language !== 'en' && language !== 'bm') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Language must be "en" or "bm"',
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        quote: {
          id: quote.id,
          text: language === 'en' ? quote.textEn : quote.textBm,
          language,
          category: quote.category,
          author: quote.author,
          sourceType: quote.sourceType,
        },
        meta: {
          date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
          isQuoteOfTheDay: true,
        },
      },
    });

  } catch (error) {
    console.error('[Quote of the Day API Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get quote of the day',
        },
      },
      { status: 500 }
    );
  }
}
