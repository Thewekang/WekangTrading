/**
 * GET    /api/trading-accounts/[id]/checklist?date=YYYY-MM-DD
 *   → Get (or create) today's checklist + high-impact news + current market session
 *
 * PATCH  /api/trading-accounts/[id]/checklist
 *   body: { date: 'YYYY-MM-DD', itemStates: { [key]: { checked, remark? } } }
 *   → Merge-update item states
 *
 * DELETE /api/trading-accounts/[id]/checklist?date=YYYY-MM-DD
 *   → Reset all items to unchecked (clean slate)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { auth } from '@/lib/auth';
import { getAccount, getAccountRules } from '@/lib/services/tradingAccountService';
import {
  getOrCreateChecklist,
  updateChecklist,
  resetChecklist,
  getTodayHighImpactNews,
} from '@/lib/services/checklistService';
import { updateChecklistSchema } from '@/lib/validations';
import { getLocalDateStr } from '@/lib/utils/dateUtils';
import { calculateMarketSession } from '@/lib/utils/marketSessions';

type Params = { params: Promise<{ id: string }> };

// ── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 },
    );
  }

  const { id } = await params;

  try {
    const account = await getAccount(id, session.user.id);
    if (!account) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Account not found' } },
        { status: 404 },
      );
    }

    // Resolve timezone from account rules (fallback to UTC)
    const rules = await getAccountRules(id);
    const timezone = rules?.dailyResetTimezone ?? 'UTC';

    // Determine the trade date (local in account timezone)
    const now = new Date();
    const todayStr = getLocalDateStr(now, timezone);

    const dateParam = req.nextUrl.searchParams.get('date');
    const tradeDate = dateParam ?? todayStr;
    const isToday = tradeDate === todayStr;

    // Fetch or create checklist
    const checklist = await getOrCreateChecklist(id, session.user.id, tradeDate);

    // Fetch HIGH-impact news for that date (UTC date string)
    const newsEvents = await getTodayHighImpactNews(tradeDate);

    // Current market session (only meaningful for today)
    const currentSession = isToday ? calculateMarketSession(now) : null;

    return NextResponse.json({
      success: true,
      data: {
        checklist,
        newsEvents,
        currentSession,
        tradeDate,
        isToday,
        timezone,
      },
    });
  } catch (error) {
    console.error('[GET /api/trading-accounts/[id]/checklist]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 },
    );
  }
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 },
    );
  }

  const { id } = await params;

  try {
    const account = await getAccount(id, session.user.id);
    if (!account) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Account not found' } },
        { status: 404 },
      );
    }

    const body = await req.json();
    const { date, ...rest } = body as { date?: string; itemStates?: unknown };

    const rules = await getAccountRules(id);
    const timezone = rules?.dailyResetTimezone ?? 'UTC';
    const tradeDate = date ?? getLocalDateStr(new Date(), timezone);

    const input = updateChecklistSchema.parse({ itemStates: rest.itemStates });
    const updated = await updateChecklist(id, session.user.id, tradeDate, input);

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.issues[0]?.message ?? 'Validation failed' },
        },
        { status: 400 },
      );
    }
    console.error('[PATCH /api/trading-accounts/[id]/checklist]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 },
    );
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 },
    );
  }

  const { id } = await params;

  try {
    const account = await getAccount(id, session.user.id);
    if (!account) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Account not found' } },
        { status: 404 },
      );
    }

    const rules = await getAccountRules(id);
    const timezone = rules?.dailyResetTimezone ?? 'UTC';

    const dateParam = req.nextUrl.searchParams.get('date');
    const tradeDate = dateParam ?? getLocalDateStr(new Date(), timezone);

    const fresh = await resetChecklist(id, session.user.id, tradeDate);

    return NextResponse.json({ success: true, data: fresh });
  } catch (error) {
    console.error('[DELETE /api/trading-accounts/[id]/checklist]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 },
    );
  }
}
