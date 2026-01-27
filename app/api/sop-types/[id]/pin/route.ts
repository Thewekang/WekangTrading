import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { pinSopType, unpinSopType } from '@/lib/services/sopTypeService';

/**
 * POST /api/sop-types/[id]/pin
 * Pin a SOP type for the current user (max 3)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const sopTypeId = params.id;

    await pinSopType(session.user.id, sopTypeId);

    return NextResponse.json({
      success: true,
      message: 'SOP type pinned successfully'
    });
  } catch (error: any) {
    console.error('Error pinning SOP type:', error);
    
    if (error.message === 'Maximum 3 pinned SOP types allowed') {
      return NextResponse.json(
        { success: false, error: { code: 'MAX_PINS_EXCEEDED', message: error.message } },
        { status: 400 }
      );
    }
    
    if (error.message === 'SOP type already pinned') {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_PINNED', message: error.message } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to pin SOP type' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sop-types/[id]/pin
 * Unpin a SOP type for the current user
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const sopTypeId = params.id;

    await unpinSopType(session.user.id, sopTypeId);

    return NextResponse.json({
      success: true,
      message: 'SOP type unpinned successfully'
    });
  } catch (error: any) {
    console.error('Error unpinning SOP type:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to unpin SOP type' } },
      { status: 500 }
    );
  }
}
