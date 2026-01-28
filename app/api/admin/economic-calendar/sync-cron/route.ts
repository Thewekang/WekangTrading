import { NextResponse } from 'next/server';
import { syncEconomicEventsFromAPI } from '@/lib/services/economicCalendarService';
import { db } from '@/lib/db';
import { cronLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/admin/economic-calendar/sync-cron
// Automated cron endpoint triggered by Vercel Cron
// Schedule: Monday-Friday at 05:00 UTC (00:00 EST)
export async function GET(request: Request) {
  const startTime = Date.now();
  const logId = `cron_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Verify Vercel cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error('❌ Invalid cron secret');
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_CRON_SECRET', 
            message: 'Unauthorized cron request' 
          } 
        },
        { status: 401 }
      );
    }

    console.log('🔄 Cron job started: economic-calendar-sync');

    // Log start
    await db.insert(cronLogs).values({
      id: logId,
      jobName: 'economic-calendar-sync',
      status: 'RUNNING',
      startedAt: new Date(),
      message: 'Starting automatic economic calendar sync from RapidAPI',
    });

    // Sync events from RapidAPI
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
          message: `Successfully imported ${result.imported} events from RapidAPI (automated)`,
        })
        .where(eq(cronLogs.id, logId));

      console.log(`✅ Cron job completed: ${result.imported} events imported in ${duration}ms`);

      return NextResponse.json({
        success: true,
        message: `Successfully imported ${result.imported} events from RapidAPI`,
        data: { 
          imported: result.imported,
          duration,
          logId 
        },
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
          errorMessage: result.error || 'Failed to sync events from RapidAPI',
          message: 'Automated sync failed',
          details: JSON.stringify({ error: result.error }),
        })
        .where(eq(cronLogs.id, logId));

      console.error(`❌ Cron job failed: ${result.error}`);

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SYNC_FAILED',
            message: result.error || 'Failed to sync events from RapidAPI',
            details: { logId },
          },
        },
        { status: 500 }
      );
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    // Log critical error
    try {
      await db.update(cronLogs)
        .set({
          status: 'ERROR',
          completedAt: new Date(),
          duration,
          itemsProcessed: 0,
          errorCode: 'INTERNAL_ERROR',
          errorMessage,
          message: 'Critical error during automated sync',
          details: JSON.stringify({ error: errorMessage }),
        })
        .where(eq(cronLogs.id, logId));
    } catch (logError) {
      console.error('❌ Failed to log error:', logError);
    }

    console.error('💥 Cron job error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred during cron sync',
          details: { logId },
        },
      },
      { status: 500 }
    );
  }
}
