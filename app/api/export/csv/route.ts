/**
 * CSV Export API
 * GET /api/export/csv - Export trades as CSV
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTradesForExport, generateCSV } from '@/lib/services/exportService';

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const filters: any = {
      userId: session.user.id,
    };

    if (searchParams.get('startDate')) {
      filters.startDate = new Date(searchParams.get('startDate')!);
    }
    if (searchParams.get('endDate')) {
      filters.endDate = new Date(searchParams.get('endDate')!);
    }
    if (searchParams.get('result')) {
      filters.result = searchParams.get('result') as 'WIN' | 'LOSS';
    }
    if (searchParams.get('marketSession')) {
      filters.marketSession = searchParams.get('marketSession') as 'ASIA' | 'EUROPE' | 'US' | 'ASIA_EUROPE_OVERLAP' | 'EUROPE_US_OVERLAP';
    }
    const sopParam = searchParams.get('sopFollowed');
    if (sopParam && sopParam !== '') {
      filters.sopFollowed = sopParam === 'true';
    }
    const minProfitParam = searchParams.get('minProfitLoss');
    if (minProfitParam && minProfitParam !== '') {
      filters.minProfitLoss = parseFloat(minProfitParam);
    }
    const maxProfitParam = searchParams.get('maxProfitLoss');
    if (maxProfitParam && maxProfitParam !== '') {
      filters.maxProfitLoss = parseFloat(maxProfitParam);
    }

    // Get trades
    const trades = await getTradesForExport(filters);

    if (trades.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_DATA', message: 'No trades found for export' } },
        { status: 404 }
      );
    }

    // Generate CSV
    const csv = generateCSV(trades);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `wekang-trades-${timestamp}.csv`;

    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('[CSV Export API Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to export trades',
        },
      },
      { status: 500 }
    );
  }
}
