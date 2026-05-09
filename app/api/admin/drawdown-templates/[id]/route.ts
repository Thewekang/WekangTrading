/**
 * PATCH  /api/admin/drawdown-templates/[id]  — Update a template
 * DELETE /api/admin/drawdown-templates/[id]  — Delete a template
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTemplate, updateTemplate, deleteTemplate } from '@/lib/services/drawdownTemplateService';
import { drawdownTemplateSchema } from '@/lib/validations';
import { ZodError } from 'zod';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } }, { status: 403 });

  const { id } = await params;
  try {
    const existing = await getTemplate(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Template not found' } }, { status: 404 });
    }
    const body = await request.json();
    const input = drawdownTemplateSchema.partial().parse(body);
    const updated = await updateTemplate(id, input);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.issues[0]?.message ?? 'Validation failed' } }, { status: 400 });
    }
    console.error('[PATCH /api/admin/drawdown-templates/[id]]', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } }, { status: 403 });

  const { id } = await params;
  try {
    const existing = await getTemplate(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Template not found' } }, { status: 404 });
    }
    await deleteTemplate(id);
    return NextResponse.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    console.error('[DELETE /api/admin/drawdown-templates/[id]]', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}
