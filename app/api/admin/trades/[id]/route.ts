/**
 * Admin Trade Detail API
 * DELETE: Delete any trade (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { individualTrades } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
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

    // Get trade first to find userId for summary update
    const [trade] = await db
      .select()
      .from(individualTrades)
      .where(eq(individualTrades.id, id))
      .limit(1);

    if (!trade) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Trade not found' } },
        { status: 404 }
      );
    }

    // Delete trade
    await db.delete(individualTrades).where(eq(individualTrades.id, id));

    // Update daily summary
    await updateDailySummary(trade.userId, trade.tradeTimestamp);

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
