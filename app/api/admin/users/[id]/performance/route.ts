import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { users, dailySummaries } from '@/lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

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

    // Check if user exists
    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    if (monthParam) {
      // Monthly view - return daily breakdown
      const month = parseInt(monthParam);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Last day of month

      const summaries = await db
        .select({
          tradeDate: dailySummaries.tradeDate,
          totalTrades: dailySummaries.totalTrades,
          totalWins: dailySummaries.totalWins,
          totalLosses: dailySummaries.totalLosses,
          totalProfitLossUsd: dailySummaries.totalProfitLossUsd,
          totalSopFollowed: dailySummaries.totalSopFollowed,
        })
        .from(dailySummaries)
        .where(
          and(
            eq(dailySummaries.userId, userId),
            gte(dailySummaries.tradeDate, startDate),
            lte(dailySummaries.tradeDate, endDate)
          )
        )
        .orderBy(dailySummaries.tradeDate);

      // Create a map for quick lookup
      const performanceMap = new Map(
        summaries.map(summary => [
          summary.tradeDate.getDate(),
          {
            date: summary.tradeDate.getDate(),
            totalTrades: summary.totalTrades,
            totalWins: summary.totalWins,
            totalLosses: summary.totalLosses,
            totalSopFollowed: summary.totalSopFollowed,
            profitLoss: summary.totalProfitLossUsd,
            winRate: summary.totalTrades > 0 
              ? (summary.totalWins / summary.totalTrades) * 100 
              : 0,
            sopRate: summary.totalTrades > 0
              ? (summary.totalSopFollowed / summary.totalTrades) * 100
              : 0
          }
        ])
      );

      // Fill in all days of the month
      const daysInMonth = endDate.getDate();
      const dailyPerformance = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        return performanceMap.get(day) || {
          date: day,
          totalTrades: 0,
          totalWins: 0,
          totalLosses: 0,
          totalSopFollowed: 0,
          profitLoss: 0,
          winRate: 0,
          sopRate: 0
        };
      });

      // Calculate monthly totals
      const monthlyTotal: {
        profitLoss: number;
        totalTrades: number;
        totalWins: number;
        totalLosses: number;
        totalSopFollowed: number;
        winRate: number;
        sopRate: number;
      } = {
        profitLoss: summaries.reduce((sum, s) => sum + s.totalProfitLossUsd, 0),
        totalTrades: summaries.reduce((sum, s) => sum + s.totalTrades, 0),
        totalWins: summaries.reduce((sum, s) => sum + s.totalWins, 0),
        totalLosses: summaries.reduce((sum, s) => sum + s.totalLosses, 0),
        totalSopFollowed: summaries.reduce((sum, s) => sum + s.totalSopFollowed, 0),
        winRate: 0,
        sopRate: 0
      };

      monthlyTotal.winRate = monthlyTotal.totalTrades > 0
        ? (monthlyTotal.totalWins / monthlyTotal.totalTrades) * 100
        : 0;
      
      monthlyTotal.sopRate = monthlyTotal.totalTrades > 0
        ? (monthlyTotal.totalSopFollowed / monthlyTotal.totalTrades) * 100
        : 0;

      return NextResponse.json({
        success: true,
        data: {
          user,
          view: 'month',
          year,
          month,
          monthName: new Date(year, month - 1).toLocaleString('en-US', { month: 'long' }),
          dailyPerformance,
          summary: monthlyTotal
        }
      });
    } else {
      // Yearly view - return monthly breakdown
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);

      const summaries = await db
        .select({
          tradeDate: dailySummaries.tradeDate,
          totalTrades: dailySummaries.totalTrades,
          totalWins: dailySummaries.totalWins,
          totalLosses: dailySummaries.totalLosses,
          totalProfitLossUsd: dailySummaries.totalProfitLossUsd,
          totalSopFollowed: dailySummaries.totalSopFollowed,
        })
        .from(dailySummaries)
        .where(
          and(
            eq(dailySummaries.userId, userId),
            gte(dailySummaries.tradeDate, startDate),
            lte(dailySummaries.tradeDate, endDate)
          )
        );

      // Group by month
      const monthlyMap = new Map<number, {
        totalTrades: number;
        totalWins: number;
        totalLosses: number;
        totalSopFollowed: number;
        profitLoss: number;
      }>();

      summaries.forEach(summary => {
        const month = summary.tradeDate.getMonth(); // 0-11
        const existing = monthlyMap.get(month) || {
          totalTrades: 0,
          totalWins: 0,
          totalLosses: 0,
          totalSopFollowed: 0,
          profitLoss: 0
        };

        monthlyMap.set(month, {
          totalTrades: existing.totalTrades + summary.totalTrades,
          totalWins: existing.totalWins + summary.totalWins,
          totalLosses: existing.totalLosses + summary.totalLosses,
          totalSopFollowed: existing.totalSopFollowed + summary.totalSopFollowed,
          profitLoss: existing.profitLoss + summary.totalProfitLossUsd
        });
      });

      // Create monthly performance array
      const monthlyPerformance = Array.from({ length: 12 }, (_, i) => {
        const data = monthlyMap.get(i) || {
          totalTrades: 0,
          totalWins: 0,
          totalLosses: 0,
          totalSopFollowed: 0,
          profitLoss: 0
        };

        return {
          month: i + 1,
          monthName: new Date(year, i).toLocaleString('en-US', { month: 'short' }),
          totalTrades: data.totalTrades,
          totalWins: data.totalWins,
          totalLosses: data.totalLosses,
          totalSopFollowed: data.totalSopFollowed,
          profitLoss: data.profitLoss,
          winRate: data.totalTrades > 0 ? (data.totalWins / data.totalTrades) * 100 : 0,
          sopRate: data.totalTrades > 0 ? (data.totalSopFollowed / data.totalTrades) * 100 : 0
        };
      });

      // Calculate yearly totals
      const yearlyTotal: {
        profitLoss: number;
        totalTrades: number;
        totalWins: number;
        totalLosses: number;
        totalSopFollowed: number;
        winRate: number;
        sopRate: number;
      } = {
        profitLoss: summaries.reduce((sum, s) => sum + s.totalProfitLossUsd, 0),
        totalTrades: summaries.reduce((sum, s) => sum + s.totalTrades, 0),
        totalWins: summaries.reduce((sum, s) => sum + s.totalWins, 0),
        totalLosses: summaries.reduce((sum, s) => sum + s.totalLosses, 0),
        totalSopFollowed: summaries.reduce((sum, s) => sum + s.totalSopFollowed, 0),
        winRate: 0,
        sopRate: 0
      };

      yearlyTotal.winRate = yearlyTotal.totalTrades > 0
        ? (yearlyTotal.totalWins / yearlyTotal.totalTrades) * 100
        : 0;
      
      yearlyTotal.sopRate = yearlyTotal.totalTrades > 0
        ? (yearlyTotal.totalSopFollowed / yearlyTotal.totalTrades) * 100
        : 0;

      return NextResponse.json({
        success: true,
        data: {
          user,
          view: 'year',
          year,
          monthlyPerformance,
          summary: yearlyTotal
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
