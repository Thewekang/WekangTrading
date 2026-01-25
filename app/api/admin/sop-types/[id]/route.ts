import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { updateSopType, deleteSopType } from '@/lib/services/sopTypeService';
import { updateSopDetail, validateImageSize } from '@/lib/services/sopDetailService';

/**
 * PATCH /api/admin/sop-types/[id]
 * Update SOP type (admin only)
 * Now supports detail fields: detailContent, detailEnabled
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
    const { 
      name, 
      description, 
      sortOrder, 
      active, 
      detailContentShort, 
      detailContentLong,
      detailEnabledShort,
      detailEnabledLong
    } = body;

    // Handle basic field updates
    const basicUpdates: any = {};
    if (name !== undefined) basicUpdates.name = name.trim();
    if (description !== undefined) basicUpdates.description = description?.trim();
    if (sortOrder !== undefined) basicUpdates.sortOrder = sortOrder;
    if (active !== undefined) basicUpdates.active = active;

    let sopType;

    // Update basic fields if any
    if (Object.keys(basicUpdates).length > 0) {
      sopType = await updateSopType(id, basicUpdates);
    }

    // Handle detail fields separately (includes HTML sanitization)
    if (
      detailContentShort !== undefined || 
      detailContentLong !== undefined ||
      detailEnabledShort !== undefined ||
      detailEnabledLong !== undefined
    ) {
      // Parse JSON structure to extract and validate images
      let shortContent = detailContentShort;
      let longContent = detailContentLong;
      
      // Validate image sizes in short entry if provided
      if (detailContentShort) {
        try {
          const parsed = JSON.parse(detailContentShort);
          if (parsed.images && Array.isArray(parsed.images)) {
            for (const image of parsed.images) {
              const validation = validateImageSize(image);
              if (!validation.valid) {
                return NextResponse.json(
                  { 
                    success: false, 
                    error: { 
                      code: 'IMAGE_TOO_LARGE', 
                      message: `Short entry image size (${validation.sizeKB}KB) exceeds maximum allowed size (500KB)` 
                    } 
                  },
                  { status: 400 }
                );
              }
            }
          }
          // Keep as JSON string for storage
          shortContent = detailContentShort;
        } catch {
          // Not JSON, treat as legacy plain text
          shortContent = detailContentShort;
        }
      }

      // Validate image sizes in long entry if provided
      if (detailContentLong) {
        try {
          const parsed = JSON.parse(detailContentLong);
          if (parsed.images && Array.isArray(parsed.images)) {
            for (const image of parsed.images) {
              const validation = validateImageSize(image);
              if (!validation.valid) {
                return NextResponse.json(
                  { 
                    success: false, 
                    error: { 
                      code: 'IMAGE_TOO_LARGE', 
                      message: `Long entry image size (${validation.sizeKB}KB) exceeds maximum allowed size (500KB)` 
                    } 
                  },
                  { status: 400 }
                );
              }
            }
          }
          // Keep as JSON string for storage
          longContent = detailContentLong;
        } catch {
          // Not JSON, treat as legacy plain text
          longContent = detailContentLong;
        }
      }

      sopType = await updateSopDetail(
        id,
        {
          detailContentShort: shortContent,
          detailContentLong: longContent,
          detailEnabledShort: detailEnabledShort !== undefined ? detailEnabledShort : undefined,
          detailEnabledLong: detailEnabledLong !== undefined ? detailEnabledLong : undefined,
        },
        session.user.id
      );
    }

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

    if (error.message.includes('not found')) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: error.message } },
        { status: 404 }
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
