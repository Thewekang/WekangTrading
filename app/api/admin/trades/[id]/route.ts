/**
 * Admin Trade Detail API
 * DELETE: Delete any trade (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { updateDailySummary } from '@/lib/services/dailySummaryService';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Get trade info before deleting (for daily summary update)
    const trade = await prisma.individualTrade.findUnique({
      where: { id },
      select: {
        userId: true,
        tradeTimestamp: true,
      },
    });

    if (!trade) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Trade not found' } },
        { status: 404 }
      );
    }

    // Delete trade
    await prisma.individualTrade.delete({
      where: { id },
    });

    // Update daily summary
    const tradeDate = new Date(trade.tradeTimestamp);
    tradeDate.setHours(0, 0, 0, 0);
    await updateDailySummary(trade.userId, tradeDate);

    return NextResponse.json({
      success: true,
      message: 'Trade deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting trade:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete trade' } },
      { status: 500 }
    );
  }
}
