/**
 * API Route: /api/stats/symbols
 * GET - Return unique symbols traded by the current user (for filter autocomplete)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUniqueSymbols } from '@/lib/services/individualTradeService';

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const symbols = await getUniqueSymbols(session.user.id);
    return NextResponse.json({ success: true, data: symbols }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/stats/symbols]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch symbols' } },
      { status: 500 }
    );
  }
}
