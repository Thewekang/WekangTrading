/**
 * Public Drawdown Templates API
 * GET /api/drawdown-templates?accountType=FUTURES
 * Returns templates visible to authenticated users (filtered by account type if provided).
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTemplatesForAccountType, getAllTemplates } from '@/lib/services/drawdownTemplateService';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
    }

    const accountType = req.nextUrl.searchParams.get('accountType') as
      | 'PROP_FIRM' | 'FUTURES' | 'CFD' | 'FOREX' | 'SHARE' | 'DEMO'
      | null;

    const templates = accountType
      ? await getTemplatesForAccountType(accountType)
      : await getAllTemplates();

    return NextResponse.json({ success: true, data: templates });
  } catch (error) {
    console.error('Error fetching drawdown templates:', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch templates' } }, { status: 500 });
  }
}
