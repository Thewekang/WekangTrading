import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { updateSopType, deleteSopType } from '@/lib/services/sopTypeService';

/**
 * PATCH /api/admin/sop-types/[id]
 * Update SOP type (admin only)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await req.json();
    const { name, description, sortOrder, active } = body;

    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim();
    if (sortOrder !== undefined) updates.sortOrder = sortOrder;
    if (active !== undefined) updates.active = active;

    const sopType = await updateSopType(id, updates);

    return NextResponse.json({
      success: true,
      data: sopType
    });
  } catch (error: any) {
    console.error('Error updating SOP type:', error);
    
    if (error.message.includes('already exists')) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE', message: error.message } },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update SOP type' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/sop-types/[id]
 * Delete SOP type (admin only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    await deleteSopType(id);

    return NextResponse.json({
      success: true,
      message: 'SOP type deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting SOP type:', error);
    
    if (error.message.includes('Cannot delete')) {
      return NextResponse.json(
        { success: false, error: { code: 'IN_USE', message: error.message } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete SOP type' } },
      { status: 500 }
    );
  }
}
