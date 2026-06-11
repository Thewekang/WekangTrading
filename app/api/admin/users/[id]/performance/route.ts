import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getYearlyPerformance, getMonthlyPerformance } from '@/lib/services/performanceAnalyticsService';
import { getAccountRules } from '@/lib/services/tradingAccountService';

/**
 * GET /api/admin/users/[id]/performance?year=2025&month=1
 * Admin endpoint to view user performance calendar
 * Returns daily performance for a specific month or monthly performance for a year
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const { id: userId } = await params;
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const monthParam = searchParams.get('month');
    const tradingAccountId = searchParams.get('tradingAccountId') || undefined;

    // Check if user exists and get their preferred timezone
    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email, preferredTimezone: users.preferredTimezone })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    // Resolve timezone: prefer account's dailyResetTimezone (broker day boundary),
    // fall back to user's preferredTimezone. This mirrors /api/analytics/performance.
    let timezone = user.preferredTimezone || 'Asia/Kuala_Lumpur';
    if (tradingAccountId) {
      const rules = await getAccountRules(tradingAccountId);
      if (rules?.dailyResetTimezone) {
        timezone = rules.dailyResetTimezone;
      }
    }

    if (monthParam) {
      const month = parseInt(monthParam);

      // Use the same service as /api/analytics/performance — timezone-aware, queries individualTrades
      const monthlyData = await getMonthlyPerformance(userId, year, month, timezone, tradingAccountId);

      // Map service's dailyBreakdown (sparse) to full-month array expected by UserPerformanceCalendar
      const daysInMonth = new Date(year, month, 0).getDate();
      const dayMap = new Map(
        monthlyData.dailyBreakdown.map(d => [new Date(d.date).getDate(), d])
      );

      const dailyPerformance = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const d = dayMap.get(day);
        return {
          date: day,
          totalTrades: d?.trades ?? 0,
          totalWins: d?.wins ?? 0,
          totalLosses: d?.losses ?? 0,
          totalSopFollowed: d ? Math.round((d.sopRate / 100) * d.trades) : 0,
          profitLoss: d?.pnl ?? 0,
          grossProfitLoss: d?.grossPnl ?? d?.pnl ?? 0,
          winRate: d?.winRate ?? 0,
          sopRate: d?.sopRate ?? 0,
        };
      });

      const ov = monthlyData.overview;
      const summary = {
        profitLoss: ov.totalPnl,
        grossProfitLoss: ov.totalGrossPnl ?? ov.totalPnl,
        totalTrades: ov.totalTrades,
        totalWins: ov.totalWins,
        totalLosses: ov.totalLosses,
        totalSopFollowed: ov.totalTrades > 0 ? Math.round((ov.sopRate / 100) * ov.totalTrades) : 0,
        winRate: ov.winRate,
        sopRate: ov.sopRate,
      };

      return NextResponse.json({
        success: true,
        data: {
          user,
          view: 'month',
          year,
          month,
          monthName: new Date(year, month - 1).toLocaleString('en-US', { month: 'long' }),
          timezone,
          dailyPerformance,
          summary,
          withdrawals: monthlyData.withdrawals,
        }
      });
    } else {
      // Use the same service as /api/analytics/performance — timezone-aware, queries individualTrades
      const yearlyData = await getYearlyPerformance(userId, year, timezone, tradingAccountId);

      // Map service's monthlyBreakdown to the format expected by UserPerformanceCalendar
      const monthlyPerformance = yearlyData.monthlyBreakdown.map(m => ({
        month: m.monthNumber,
        monthName: m.month,
        totalTrades: m.trades,
        totalWins: m.wins,
        totalLosses: m.losses,
        totalSopFollowed: m.trades > 0 ? Math.round((m.sopRate / 100) * m.trades) : 0,
        profitLoss: m.pnl,
        grossProfitLoss: m.grossPnl ?? m.pnl,
        winRate: m.winRate,
        sopRate: m.sopRate,
      }));

      const ov = yearlyData.overview;
      const summary = {
        profitLoss: ov.totalPnl,
        grossProfitLoss: ov.totalGrossPnl ?? ov.totalPnl,
        totalTrades: ov.totalTrades,
        totalWins: ov.totalWins,
        totalLosses: ov.totalLosses,
        totalSopFollowed: ov.totalTrades > 0 ? Math.round((ov.sopRate / 100) * ov.totalTrades) : 0,
        winRate: ov.winRate,
        sopRate: ov.sopRate,
      };

      return NextResponse.json({
        success: true,
        data: {
          user,
          view: 'year',
          year,
          timezone,
          monthlyPerformance,
          summary,
          withdrawals: yearlyData.withdrawals,
        }
      });
    }
  } catch (error) {
    console.error('Error fetching user performance:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch user performance' } },
      { status: 500 }
    );
  }
}
