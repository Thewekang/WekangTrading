import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { reorderSopTypes } from '@/lib/services/sopTypeService';
import { z } from 'zod';

const reorderSchema = z.object({
  orderedIds: z.array(z.string()).min(1)
});

/**
 * POST /api/admin/sop-types/reorder
 * Reorder SOP types by updating sortOrder based on array position
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = reorderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: validation.error.message } },
        { status: 400 }
      );
    }

    const { orderedIds } = validation.data;

    await reorderSopTypes(orderedIds);

    return NextResponse.json({
      success: true,
      message: 'SOP types reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering SOP types:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to reorder SOP types' } },
      { status: 500 }
    );
  }
}
