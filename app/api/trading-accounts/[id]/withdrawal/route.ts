/**
 * GET  /api/trading-accounts/[id]/withdrawal  — Get withdrawal history
 * POST /api/trading-accounts/[id]/withdrawal  — Record a withdrawal event
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAccount } from '@/lib/services/tradingAccountService';
import { recordWithdrawal, getWithdrawalHistory } from '@/lib/services/accountRulesService';
import { withdrawalEventSchema } from '@/lib/validations';
import { ZodError } from 'zod';

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
    const history = await getWithdrawalHistory(id);
    return NextResponse.json({ success: true, data: history });
  } catch (error) {
    console.error('[GET /api/trading-accounts/[id]/withdrawal]', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
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

    const body = await request.json();
    const input = withdrawalEventSchema.parse(body);
    const event = await recordWithdrawal({ tradingAccountId: id, ...input });
    return NextResponse.json({ success: true, data: event }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.issues[0]?.message ?? 'Validation failed' } }, { status: 400 });
    }
    console.error('[POST /api/trading-accounts/[id]/withdrawal]', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}
