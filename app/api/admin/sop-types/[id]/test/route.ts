import { NextRequest, NextResponse } from 'next/server';
// Step 2: Add database imports
import { db } from '@/lib/db';
import { sopTypes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Test endpoint - Step 2: Test database imports
 * GET /api/admin/sop-types/[id]/test
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Step 2: Try database query
    const [sopType] = await db.select().from(sopTypes).where(eq(sopTypes.id, id)).limit(1);
    
    return NextResponse.json({
      success: true,
      step: 2,
      message: 'Database import and query works',
      id,
      sopTypeFound: !!sopType,
      sopTypeName: sopType?.name || null,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      step: 2,
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
