/**
 * POST /api/trading-accounts/[id]/reset
 * Resets all trading data for an account (trades, summaries, targets, etc.)
 * Keeps the account record and its rules.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { resetAccount } from '@/lib/services/tradingAccountService';

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const result = await resetAccount(id, session.user.id);
    return NextResponse.json({
      success: true,
      data: result,
      message: 'Account data reset successfully.',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Account not found') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Account not found' } },
        { status: 404 }
      );
    }
    console.error('[POST /api/trading-accounts/[id]/reset]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
