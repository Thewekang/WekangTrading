/**
 * GET    /api/trading-accounts/[id]/strategies/[strategyId]  — Get single strategy
 * PATCH  /api/trading-accounts/[id]/strategies/[strategyId]  — Update strategy
 * DELETE /api/trading-accounts/[id]/strategies/[strategyId]  — Soft delete strategy
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAccount } from '@/lib/services/tradingAccountService';
import {
  getStrategy,
  updateStrategy,
  deleteStrategy,
  parseBestSessions,
} from '@/lib/services/accountStrategyService';
import { updateStrategySchema } from '@/lib/validations';
import { ZodError } from 'zod';

type Params = { params: Promise<{ id: string; strategyId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const { id, strategyId } = await params;
  try {
    const account = await getAccount(id, session.user.id);
    if (!account) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Account not found' } }, { status: 404 });
    }

    const strategy = await getStrategy(strategyId, id, session.user.id);
    if (!strategy) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Strategy not found' } }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { ...strategy, bestSessions: parseBestSessions(strategy.bestSessions) } });
  } catch (error) {
    console.error('[GET /api/trading-accounts/[id]/strategies/[strategyId]]', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const { id, strategyId } = await params;
  try {
    const account = await getAccount(id, session.user.id);
    if (!account) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Account not found' } }, { status: 404 });
    }

    const body = await request.json();
    const patch = updateStrategySchema.parse(body);
    const updated = await updateStrategy(strategyId, id, session.user.id, patch);

    if (!updated) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Strategy not found' } }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { ...updated, bestSessions: parseBestSessions(updated.bestSessions) } });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.issues[0]?.message ?? 'Validation failed' } }, { status: 400 });
    }
    console.error('[PATCH /api/trading-accounts/[id]/strategies/[strategyId]]', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const { id, strategyId } = await params;
  try {
    const account = await getAccount(id, session.user.id);
    if (!account) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Account not found' } }, { status: 404 });
    }

    const deleted = await deleteStrategy(strategyId, id, session.user.id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Strategy not found' } }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Strategy deleted' });
  } catch (error) {
    console.error('[DELETE /api/trading-accounts/[id]/strategies/[strategyId]]', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}
