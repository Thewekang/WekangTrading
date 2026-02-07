/**
 * User Quote Preferences API
 * GET /api/quotes/preferences - Get user's quote preferences
 * PATCH /api/quotes/preferences - Update user's quote preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { 
  getUserQuotePreferences, 
  updateQuotePreferences,
  resetQuoteShowCount,
} from '@/lib/services/userQuotePreferencesService';
import { updateQuotePreferencesSchema } from '@/lib/validations/quote';

/**
 * GET /api/quotes/preferences
 * Get user's quote preferences
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

    const preferences = await getUserQuotePreferences(session.user.id);

    if (!preferences) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { preferences },
    });

  } catch (error) {
    console.error('[Quote Preferences API Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch preferences',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/quotes/preferences
 * Update user's quote preferences
 */
export async function PATCH(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = updateQuotePreferencesSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid preference data',
            details: validation.error.format(),
          },
        },
        { status: 400 }
      );
    }

    // Update preferences
    await updateQuotePreferences(session.user.id, validation.data);

    // Reset show count if requested
    if (body.resetShowCount === true) {
      await resetQuoteShowCount(session.user.id);
    }

    // Get updated preferences
    const updatedPreferences = await getUserQuotePreferences(session.user.id);

    return NextResponse.json({
      success: true,
      data: { preferences: updatedPreferences },
      message: 'Preferences updated successfully',
    });

  } catch (error) {
    console.error('[Quote Preferences API Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update preferences',
        },
      },
      { status: 500 }
    );
  }
}
