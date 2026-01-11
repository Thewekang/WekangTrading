/**
 * PDF Export API
 * POST /api/export/pdf - Generate PDF report
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTradesForExport, generatePDFHTML } from '@/lib/services/exportService';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }
    
    const userName = session.user.name || session.user.email || 'Trader';

    // Get filters from request body
    const body = await req.json();
    const filters: any = {
      userId: session.user.id,
    };

    if (body.startDate) filters.startDate = new Date(body.startDate);
    if (body.endDate) filters.endDate = new Date(body.endDate);
    if (body.result) filters.result = body.result as 'WIN' | 'LOSS';
    if (body.marketSession) filters.marketSession = body.marketSession as 'ASIA' | 'EUROPE' | 'US' | 'ASIA_EUROPE_OVERLAP' | 'EUROPE_US_OVERLAP';
    // Handle boolean sopFollowed - skip empty strings
    if (body.sopFollowed !== undefined && body.sopFollowed !== '') {
      filters.sopFollowed = body.sopFollowed;
    }
    // Handle numeric profit/loss - skip empty strings
    if (body.minProfitLoss !== undefined && body.minProfitLoss !== '') {
      filters.minProfitLoss = Number(body.minProfitLoss);
    }
    if (body.maxProfitLoss !== undefined && body.maxProfitLoss !== '') {
      filters.maxProfitLoss = Number(body.maxProfitLoss);
    }

    // Get trades
    const trades = await getTradesForExport(filters);

    if (trades.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_DATA', message: 'No trades found for export' } },
        { status: 404 }
      );
    }

    // Generate HTML for PDF (client-side will use browser print to PDF)
    const html = generatePDFHTML(trades, userName, {
      startDate: body.startDate,
      endDate: body.endDate,
      result: body.result,
      marketSession: body.marketSession,
    });

    return NextResponse.json({
      success: true,
      data: { html, tradeCount: trades.length },
    });

  } catch (error) {
    console.error('[PDF Export API Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to generate PDF',
        },
      },
      { status: 500 }
    );
  }
}
