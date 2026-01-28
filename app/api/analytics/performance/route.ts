import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getYearlyPerformance, getMonthlyPerformance, getAvailableYears } from '@/lib/services/performanceAnalyticsService';

/**
 * GET /api/analytics/performance?year=2026&month=1
 * Get performance data for a specific year or month
 * - If only year: returns yearly overview + monthly breakdown
 * - If year + month: returns monthly overview + daily breakdown
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');
    const action = searchParams.get('action');
    
    // Get user's timezone (default to Asia/Kuala_Lumpur)
    const userTimezone = session.user.preferredTimezone || 'Asia/Kuala_Lumpur';

    // Get available years
    if (action === 'years') {
      const years = await getAvailableYears(session.user.id, userTimezone);
      return NextResponse.json({ success: true, data: years });
    }

    // Default to current year if not specified
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();

    // Validate year
    if (isNaN(year) || year < 2000 || year > 2100) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid year parameter' } },
        { status: 400 }
      );
    }

    // If month is specified, return monthly data
    if (monthParam) {
      const month = parseInt(monthParam);

      if (isNaN(month) || month < 1 || month > 12) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid month parameter (1-12)' } },
          { status: 400 }
        );
      }

      const monthlyData = await getMonthlyPerformance(session.user.id, year, month, userTimezone);
      return NextResponse.json({ success: true, data: monthlyData });
    }

    // Otherwise, return yearly data
    const yearlyData = await getYearlyPerformance(session.user.id, year, userTimezone);
    return NextResponse.json({ success: true, data: yearlyData });
  } catch (error) {
    console.error('Error fetching performance analytics:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch performance data' } },
      { status: 500 }
    );
  }
}
