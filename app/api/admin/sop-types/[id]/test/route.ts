import { NextRequest, NextResponse } from 'next/server';
// Step 3b: Test imports ONE BY ONE
import { auth } from '@/lib/auth';
// import { updateSopType, deleteSopType } from '@/lib/services/sopTypeService';
// import { updateSopDetail } from '@/lib/services/sopDetailService';
// import { validateImageSize } from '@/lib/utils/imageValidation';
import { db } from '@/lib/db';
import { sopTypes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Test endpoint - Step 3b: Test auth import only
 * GET /api/admin/sop-types/[id]/test
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Test auth
    const session = await auth();
    
    const [sopType] = await db.select().from(sopTypes).where(eq(sopTypes.id, id)).limit(1);
    
    return NextResponse.json({
      success: true,
      step: '3b-auth-only',
      message: 'Auth import works',
      id,
      hasSession: !!session,
      sopTypeFound: !!sopType,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      step: '3b-auth-only',
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
