/**
 * GET   /api/admin/drawdown-templates  — List all templates
 * POST  /api/admin/drawdown-templates  — Create a template
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAllTemplates, createTemplate } from '@/lib/services/drawdownTemplateService';
import { drawdownTemplateSchema } from '@/lib/validations';
import { ZodError } from 'zod';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } }, { status: 403 });

  try {
    const templates = await getAllTemplates();
    return NextResponse.json({ success: true, data: templates });
  } catch (error) {
    console.error('[GET /api/admin/drawdown-templates]', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } }, { status: 403 });

  try {
    const body = await request.json();
    const input = drawdownTemplateSchema.parse(body);
    const template = await createTemplate(input);
    return NextResponse.json({ success: true, data: template }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.issues[0]?.message ?? 'Validation failed' } }, { status: 400 });
    }
    console.error('[POST /api/admin/drawdown-templates]', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}
