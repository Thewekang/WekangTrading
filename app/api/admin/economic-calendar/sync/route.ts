import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { syncEconomicEventsFromAPI, importEconomicEventsFromJSON } from '@/lib/services/economicCalendarService';

// POST /api/admin/economic-calendar/sync
// Sync events from RapidAPI
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    // Handle API sync
    if (action === 'api' || !action) {
      const result = await syncEconomicEventsFromAPI();

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: `Successfully imported ${result.imported} events from API`,
          data: { imported: result.imported },
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'SYNC_FAILED',
              message: result.error || 'Failed to sync events from API',
            },
          },
          { status: 500 }
        );
      }
    }

    // Handle manual JSON import
    if (action === 'json') {
      const body = await request.json();

      if (!body.events || !Array.isArray(body.events)) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'INVALID_INPUT', message: 'Events array is required' },
          },
          { status: 400 }
        );
      }

      const result = await importEconomicEventsFromJSON(body.events);

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: `Successfully imported ${result.imported} events from JSON`,
          data: {
            imported: result.imported,
            errors: result.errors.length > 0 ? result.errors : undefined,
          },
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'IMPORT_FAILED',
              message: 'Failed to import events from JSON',
              details: result.errors,
            },
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: { code: 'INVALID_ACTION', message: 'Invalid action parameter' },
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in economic calendar sync:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}
