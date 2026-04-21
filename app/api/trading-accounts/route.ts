/**
 * GET  /api/trading-accounts        — List all accounts for the authenticated user
 * POST /api/trading-accounts        — Create a new trading account
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserAccounts, createAccount } from '@/lib/services/tradingAccountService';
import { createTradingAccountSchema } from '@/lib/validations';
import { ZodError } from 'zod';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  try {
    const accounts = await getUserAccounts(session.user.id);
    return NextResponse.json({ success: true, data: accounts });
  } catch (error) {
    console.error('[GET /api/trading-accounts]', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  try {
    const body = await request.json();
    const input = createTradingAccountSchema.parse(body);
    const account = await createAccount({ userId: session.user.id, ...input });
    return NextResponse.json({ success: true, data: account }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.issues[0]?.message ?? 'Validation failed' } }, { status: 400 });
    }
    console.error('[POST /api/trading-accounts]', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}
