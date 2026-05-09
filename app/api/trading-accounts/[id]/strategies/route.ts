/**
 * GET  /api/trading-accounts/[id]/strategies  — List all strategies for account
 * POST /api/trading-accounts/[id]/strategies  — Create a new strategy
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAccount } from '@/lib/services/tradingAccountService';
import { listStrategies, createStrategy, parseBestSessions } from '@/lib/services/accountStrategyService';
import { createStrategySchema } from '@/lib/validations';
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

    const strategies = await listStrategies(id, session.user.id);
    // Parse bestSessions JSON for each strategy
    const data = strategies.map((s) => ({ ...s, bestSessions: parseBestSessions(s.bestSessions) }));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[GET /api/trading-accounts/[id]/strategies]', error);
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
    const input = createStrategySchema.parse(body);
    const created = await createStrategy(id, session.user.id, input);
    const data = { ...created, bestSessions: parseBestSessions(created.bestSessions) };
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.issues[0]?.message ?? 'Validation failed' } }, { status: 400 });
    }
    console.error('[POST /api/trading-accounts/[id]/strategies]', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}
