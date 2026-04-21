/**
 * GET /api/trading-accounts/[id]/overview
 * Returns live cycle status: DD used, P&L, consistency, health color, target progress.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAccount } from '@/lib/services/tradingAccountService';
import { getCycleStatus } from '@/lib/services/accountRulesService';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const { id } = await params;
  try {
    const account = await getAccount(id, session.user.id);
    if (!account) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Account not found' } }, { status: 404 });
    }
    const status = await getCycleStatus(id);
    return NextResponse.json({ success: true, data: { account, cycleStatus: status } });
  } catch (error) {
    console.error('[GET /api/trading-accounts/[id]/overview]', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}
