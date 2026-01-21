import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { cronLogs } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

// GET /api/admin/economic-calendar/cron-logs
// Fetch cron execution logs
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const jobName = url.searchParams.get('jobName') || 'economic-calendar-sync';

    // Fetch logs
    const logs = await db
      .select()
      .from(cronLogs)
      .where(eq(cronLogs.jobName, jobName))
      .orderBy(desc(cronLogs.startedAt))
      .limit(Math.min(limit, 50)); // Max 50 logs

    // Calculate next run time (weekdays at 05:00 UTC)
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setUTCHours(5, 0, 0, 0);
    
    // If we've passed 05:00 UTC today, move to tomorrow
    if (now.getUTCHours() >= 5) {
      nextRun.setUTCDate(nextRun.getUTCDate() + 1);
    }
    
    // Skip to next weekday if it's weekend
    while (nextRun.getUTCDay() === 0 || nextRun.getUTCDay() === 6) {
      nextRun.setUTCDate(nextRun.getUTCDate() + 1);
    }

    const timeUntilNextRun = nextRun.getTime() - now.getTime();

    return NextResponse.json({
      success: true,
      data: {
        logs,
        nextRun: nextRun.toISOString(),
        timeUntilNextRun, // milliseconds
        schedule: {
          time: '05:00 UTC / 00:00 EST',
          days: 'Monday - Friday',
          cron: '0 5 * * 1-5',
        },
      },
    });
  } catch (error) {
    console.error('Error fetching cron logs:', error);
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
