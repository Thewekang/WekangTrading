/**
 * Admin Trade Detail API
 * DELETE: Delete any trade (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deleteTrade } from '@/lib/services/individualTradeService';

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

    // Delete trade (service handles daily summary update)
    const result = await deleteTrade(id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: result.error || 'Trade not found' } },
        { status: 404 }
      );
    }

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
