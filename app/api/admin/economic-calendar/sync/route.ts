import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { syncEconomicEventsFromAPI, importEconomicEventsFromJSON } from '@/lib/services/economicCalendarService';
import { db } from '@/lib/db';
import { cronLogs } from '@/lib/db/schema';

// POST /api/admin/economic-calendar/sync
// Sync events from RapidAPI
export async function POST(request: Request) {
  const startTime = Date.now();
  const logId = `cron_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const isCronJob = request.headers.get('user-agent')?.includes('vercel-cron');

  try {
    const session = await auth();

    // Allow cron jobs without authentication
    if (!isCronJob && (!session || session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    // Handle API sync
    if (action === 'api' || !action) {
      // Log start
      await db.insert(cronLogs).values({
        id: logId,
        jobName: 'economic-calendar-sync',
        status: 'RUNNING',
        startedAt: new Date(),
        message: 'Starting economic calendar sync from API',
      });

      const result = await syncEconomicEventsFromAPI();
      const duration = Date.now() - startTime;

      if (result.success) {
        // Log success
        await db.update(cronLogs)
          .set({
            status: 'SUCCESS',
            completedAt: new Date(),
            duration,
            itemsProcessed: result.imported,
            message: `Successfully imported ${result.imported} events from API`,
          })
          .where(eq(cronLogs.id, logId));

        return NextResponse.json({
          success: true,
          message: `Successfully imported ${result.imported} events from API`,
          data: { imported: result.imported },
        });
      } else {
        // Log error
        await db.update(cronLogs)
          .set({
            status: 'ERROR',
            completedAt: new Date(),
            duration,
            itemsProcessed: 0,
            errorCode: 'SYNC_FAILED',
            errorMessage: result.error || 'Failed to sync events from API',
            message: 'Sync failed',
            details: JSON.stringify({ error: result.error }),
          })
          .where(eq(cronLogs.id, logId));

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
    const duration = Date.now() - startTime;
    
    // Log critical error
    try {
      await db.insert(cronLogs).values({
        id: logId,
        jobName: 'economic-calendar-sync',
        status: 'ERROR',
        startedAt: new Date(startTime),
        completedAt: new Date(),
        duration,
        errorCode: 'INTERNAL_ERROR',
        errorMessage: error instanceof Error ? error.message : 'An unexpected error occurred',
        message: 'Critical error during sync',
        details: JSON.stringify({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined 
        }),
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

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
