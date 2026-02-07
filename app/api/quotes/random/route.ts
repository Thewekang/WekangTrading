/**
 * Random Quote API
 * POST /api/quotes/random - Get a random quote for the user
 * 
 * This endpoint handles cooldown checks, language rotation, and user preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getRandomQuote } from '@/lib/services/quoteService';
import { 
  canShowQuote, 
  getNextQuoteLanguage, 
  updateLastQuoteShown,
  hasReachedSessionLimit,
  getRemainingQuotesForSession,
} from '@/lib/services/userQuotePreferencesService';
import { getRandomQuoteSchema } from '@/lib/validations/quote';

/**
 * POST /api/quotes/random
 * Get a random quote with cooldown and preference checks
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

    const userId = session.user.id;

    // Parse and validate request body
    const body = await req.json();
    const validation = getRandomQuoteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validation.error.format(),
          },
        },
        { status: 400 }
      );
    }

    const { category } = validation.data;

    // Check if user can see a quote (cooldown + preferences)
    const { canShow, reason } = await canShowQuote(userId);
    if (!canShow) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'COOLDOWN_ACTIVE',
            message: reason || 'Cannot show quote at this time',
          },
        },
        { status: 429 } // Too Many Requests
      );
    }

    // Check session limit
    const reachedLimit = await hasReachedSessionLimit(userId);
    if (reachedLimit) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SESSION_LIMIT_REACHED',
            message: 'Maximum quotes per session reached. Limit resets on new session.',
          },
        },
        { status: 429 }
      );
    }

    // Get next language (alternates EN <-> BM)
    const language = await getNextQuoteLanguage(userId);

    // Get random quote
    const quote = await getRandomQuote({ userId, category, language });

    if (!quote) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_QUOTES_AVAILABLE',
            message: 'No quotes available for the specified criteria',
          },
        },
        { status: 404 }
      );
    }

    // Update user's last shown quote
    await updateLastQuoteShown(userId, quote.id, language);

    // Get remaining quotes for this session
    const remainingQuotes = await getRemainingQuotesForSession(userId);

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
          remainingQuotes,
          language,
        },
      },
    });

  } catch (error) {
    console.error('[Random Quote API Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get random quote',
        },
      },
      { status: 500 }
    );
  }
}
