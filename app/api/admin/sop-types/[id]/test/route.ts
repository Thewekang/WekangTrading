import { NextRequest, NextResponse } from 'next/server';
// Step 3e: Test sanitize import directly
import { auth } from '@/lib/auth';
import { updateSopType, deleteSopType } from '@/lib/services/sopTypeService';
// import { updateSopDetail } from '@/lib/services/sopDetailService';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { db } from '@/lib/db';
import { sopTypes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Test endpoint - Step 3e: Test sanitize import directly
 * GET /api/admin/sop-types/[id]/test
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [sopType] = await db.select().from(sopTypes).where(eq(sopTypes.id, id)).limit(1);
    
    return NextResponse.json({
      success: true,
      step: '3e-sanitize',
      message: 'sanitize import works',
      id,
      sopTypeFound: !!sopType,
      sanitizeHtmlLoaded: typeof sanitizeHtml === 'function',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      step: '3e-sanitize',
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    return NextResponse.json({
      success: true,
      method: 'PATCH',
      message: 'PATCH method works',
      id,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
