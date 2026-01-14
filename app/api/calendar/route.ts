import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUpcomingEvents, getTodayEvents, getLastSyncInfo } from '@/lib/services/economicCalendarService';

// GET /api/calendar
// Get upcoming economic events
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'upcoming';
    const days = parseInt(url.searchParams.get('days') || '7', 10);

    if (type === 'today') {
      const events = await getTodayEvents();
      const lastSync = await getLastSyncInfo();

      return NextResponse.json({
        success: true,
        data: {
          events,
          lastSync,
          count: events.length,
        },
      });
    }

    // Default: upcoming events
    const events = await getUpcomingEvents(days);
    const lastSync = await getLastSyncInfo();

    return NextResponse.json({
      success: true,
      data: {
        events,
        lastSync,
        count: events.length,
      },
    });
  } catch (error) {
    console.error('Error fetching economic calendar:', error);
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
