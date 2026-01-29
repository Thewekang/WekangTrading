import { NextRequest, NextResponse } from 'next/server';
// Step 3: Add ALL imports from main route
import { auth } from '@/lib/auth';
import { updateSopType, deleteSopType } from '@/lib/services/sopTypeService';
import { updateSopDetail } from '@/lib/services/sopDetailService';
import { validateImageSize } from '@/lib/utils/imageValidation';
import { db } from '@/lib/db';
import { sopTypes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Test endpoint - Step 3: Test ALL imports from main route
 * GET /api/admin/sop-types/[id]/test
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Step 3: All imports loaded, try database query
    const [sopType] = await db.select().from(sopTypes).where(eq(sopTypes.id, id)).limit(1);
    
    return NextResponse.json({
      success: true,
      step: 3,
      message: 'All imports work! Problem may be in PATCH logic itself.',
      id,
      sopTypeFound: !!sopType,
      sopTypeName: sopType?.name || null,
      importsLoaded: {
        auth: typeof auth === 'function',
        updateSopType: typeof updateSopType === 'function',
        deleteSopType: typeof deleteSopType === 'function',
        updateSopDetail: typeof updateSopDetail === 'function',
        validateImageSize: typeof validateImageSize === 'function'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      step: 3,
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
