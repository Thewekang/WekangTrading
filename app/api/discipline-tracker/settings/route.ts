import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserSettings, updateUserSettings } from '@/lib/services/disciplineTrackerService';
import {
  disciplineTrackerSettingsSchema,
  updateDisciplineTrackerSettingsSchema,
} from '@/lib/validations/disciplineTracker';
import { ZodError } from 'zod';

/**
 * GET /api/discipline-tracker/settings
 * Get user's discipline tracker settings
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const settings = await getUserSettings(session.user.id);

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('[GET /api/discipline-tracker/settings]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch settings' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/discipline-tracker/settings
 * Update user's discipline tracker settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validatedData = updateDisciplineTrackerSettingsSchema.parse(body);

    // Update settings
    const updatedSettings = await updateUserSettings(session.user.id, validatedData);

    return NextResponse.json({
      success: true,
      data: updatedSettings,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid settings data',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    console.error('[PATCH /api/discipline-tracker/settings]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update settings' } },
      { status: 500 }
    );
  }
}
