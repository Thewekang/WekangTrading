import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { updateSopType, deleteSopType } from '@/lib/services/sopTypeService';
import { updateSopDetail } from '@/lib/services/sopDetailService';
import { validateImageSize } from '@/lib/utils/imageValidation';
import { db } from '@/lib/db';
import { sopTypes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Next.js 15 Route Segment Config
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/sop-types/[id]
 * Get single SOP type (for debugging deployment)
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const [sopType] = await db.select().from(sopTypes).where(eq(sopTypes.id, id)).limit(1);
    
    if (!sopType) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'SOP type not found' } },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: sopType,
      debug: {
        route: 'deployed',
        runtime: 'nodejs',
        timestamp: new Date().toISOString(),
        nodeVersion: process.version
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/sop-types/[id]
 * Update SOP type (admin only)
 * Now supports detail fields: detailContent, detailEnabled
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
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

    const { id } = await context.params;
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
      // Parse JSON structure to extract content, images, and notes
      let shortContent: string | undefined;
      let shortImages: string[] | undefined;
      let shortNotes: string | undefined;
      let longContent: string | undefined;
      let longImages: string[] | undefined;
      let longNotes: string | undefined;
      
      // Process SHORT entry data
      if (detailContentShort !== undefined) {
        try {
          const parsed = JSON.parse(detailContentShort);
          if (parsed.content !== undefined) {
            // New JSON format with separate fields
            shortContent = parsed.content;
            shortImages = parsed.images || [];
            shortNotes = parsed.notes || '';
            
            // Validate image sizes
            if (shortImages && shortImages.length > 0) {
              for (const image of shortImages) {
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
          } else {
            // Legacy plain text format
            shortContent = detailContentShort;
          }
        } catch (e) {
          // Not JSON, treat as legacy plain text
          shortContent = detailContentShort;
        }
      }

      // Process LONG entry data
      if (detailContentLong !== undefined) {
        try {
          const parsed = JSON.parse(detailContentLong);
          if (parsed.content !== undefined) {
            // New JSON format with separate fields
            longContent = parsed.content;
            longImages = parsed.images || [];
            longNotes = parsed.notes || '';
            
            // Validate image sizes
            if (longImages && longImages.length > 0) {
              for (const image of longImages) {
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
          } else {
            // Legacy plain text format
            longContent = detailContentLong;
          }
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
          detailImagesShort: shortImages,
          detailImagesLong: longImages,
          detailImageNotesShort: shortNotes,
          detailImageNotesLong: longNotes,
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
  context: { params: Promise<{ id: string }> }
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

    const { id } = await context.params;
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
