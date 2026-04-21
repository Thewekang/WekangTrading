/**
 * GET   /api/admin/settings  — List all admin settings
 * PATCH /api/admin/settings  — Upsert a single setting
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAllSettings, setSetting } from '@/lib/services/adminSettingsService';
import { adminSettingSchema } from '@/lib/validations';
import { ZodError } from 'zod';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } }, { status: 403 });

  try {
    const settings = await getAllSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('[GET /api/admin/settings]', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } }, { status: 403 });

  try {
    const body = await request.json();
    const input = adminSettingSchema.parse(body);
    const updated = await setSetting(input.key, input.value, session.user.id!, input.description);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.issues[0]?.message ?? 'Validation failed' } }, { status: 400 });
    }
    console.error('[PATCH /api/admin/settings]', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}
