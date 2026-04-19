/**
 * GET /api/trading-accounts/[id]/rules  — Get account rules
 * PUT /api/trading-accounts/[id]/rules  — Upsert account rules
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAccount, upsertAccountRules, getAccountRules } from '@/lib/services/tradingAccountService';
import { accountRulesSchema } from '@/lib/validations';
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
    const rules = await getAccountRules(id);
    return NextResponse.json({ success: true, data: rules });
  } catch (error) {
    console.error('[GET /api/trading-accounts/[id]/rules]', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
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
    const input = accountRulesSchema.parse(body);
    const rules = await upsertAccountRules(id, input);
    return NextResponse.json({ success: true, data: rules });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.issues[0]?.message ?? 'Validation failed' } }, { status: 400 });
    }
    console.error('[PUT /api/trading-accounts/[id]/rules]', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}
