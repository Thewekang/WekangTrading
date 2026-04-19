/**
 * GET    /api/trading-accounts/[id]  — Get a single account (owner only)
 * PATCH  /api/trading-accounts/[id]  — Update account name/type/balance
 * DELETE /api/trading-accounts/[id]  — Deactivate account (soft delete)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAccount, updateAccount, hardDeleteAccount, setDefaultAccount } from '@/lib/services/tradingAccountService';
import { updateTradingAccountSchema } from '@/lib/validations';
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
    return NextResponse.json({ success: true, data: account });
  } catch (error) {
    console.error('[GET /api/trading-accounts/[id]]', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Verify ownership
    const account = await getAccount(id, session.user.id);
    if (!account) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Account not found' } }, { status: 404 });
    }

    const body = await request.json();

    // Special action: set as default
    if (body.setDefault === true) {
      const updated = await setDefaultAccount(id, session.user.id);
      return NextResponse.json({ success: true, data: updated });
    }

    const input = updateTradingAccountSchema.parse(body);
    const updated = await updateAccount(id, input);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.issues[0]?.message ?? 'Validation failed' } }, { status: 400 });
    }
    console.error('[PATCH /api/trading-accounts/[id]]', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const { id } = await params;
  try {
    await hardDeleteAccount(id, session.user.id);
    return NextResponse.json({ success: true, message: 'Account deleted' });
  } catch (error) {
    if (error instanceof Error && (
      error.message === 'Cannot delete your only account' ||
      error.message.startsWith('Cannot delete the default account')
    )) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: error.message } }, { status: 403 });
    }
    if (error instanceof Error && error.message === 'Account not found') {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: error.message } }, { status: 404 });
    }
    console.error('[DELETE /api/trading-accounts/[id]]', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}
