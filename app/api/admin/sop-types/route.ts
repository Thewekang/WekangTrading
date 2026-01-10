import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAllSopTypes, createSopType } from '@/lib/services/sopTypeService';

/**
 * GET /api/admin/sop-types
 * Get all SOP types (admin only)
 */
export async function GET(req: NextRequest) {
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

    const sopTypes = await getAllSopTypes();

    return NextResponse.json({
      success: true,
      data: sopTypes
    });
  } catch (error) {
    console.error('Error fetching SOP types:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch SOP types' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/sop-types
 * Create new SOP type (admin only)
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
    const { name, description, sortOrder } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Name is required' } },
        { status: 400 }
      );
    }

    const sopType = await createSopType({
      name: name.trim(),
      description: description?.trim(),
      sortOrder: sortOrder ?? 0
    });

    return NextResponse.json({
      success: true,
      data: sopType
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating SOP type:', error);
    
    if (error.message.includes('already exists')) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE', message: error.message } },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create SOP type' } },
      { status: 500 }
    );
  }
}
