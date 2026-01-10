/**
 * Monthly Statistics API
 * GET /api/stats/monthly - Get performance by month for current year
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

interface MonthlyStats {
  month: number; // 1-12
  monthName: string;
  totalTrades: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  sopRate: number;
  totalSopFollowed: number;
  profitLoss: number;
}

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Get year from query params (default to current year)
    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get('year');
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

    // Get all daily summaries for the year
    const startDate = new Date(year, 0, 1); // Jan 1
    const endDate = new Date(year, 11, 31, 23, 59, 59); // Dec 31

    const dailySummaries = await prisma.dailySummary.findMany({
      where: {
        userId: session.user.id,
        tradeDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        tradeDate: 'asc',
      },
    });

    // Group by month
    const monthlyData: MonthlyStats[] = [];
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    for (let month = 0; month < 12; month++) {
      const monthSummaries = dailySummaries.filter(summary => {
        const summaryMonth = new Date(summary.tradeDate).getMonth();
        return summaryMonth === month;
      });

      const totalTrades = monthSummaries.reduce((sum, s) => sum + s.totalTrades, 0);
      const totalWins = monthSummaries.reduce((sum, s) => sum + s.totalWins, 0);
      const totalLosses = monthSummaries.reduce((sum, s) => sum + s.totalLosses, 0);
      const totalSopFollowed = monthSummaries.reduce((sum, s) => sum + s.totalSopFollowed, 0);
      const profitLoss = monthSummaries.reduce((sum, s) => sum + s.totalProfitLossUsd, 0);

      const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
      const sopRate = totalTrades > 0 ? (totalSopFollowed / totalTrades) * 100 : 0;

      monthlyData.push({
        month: month + 1,
        monthName: monthNames[month],
        totalTrades,
        totalWins,
        totalLosses,
        winRate,
        sopRate,
        totalSopFollowed,
        profitLoss,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        year,
        months: monthlyData,
      },
    });

  } catch (error: any) {
    console.error('Monthly stats error:', error);

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch monthly statistics' } },
      { status: 500 }
    );
  }
}
