import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getRowById,
  updateRow,
  deleteRow,
  dateExists,
} from '@/lib/services/disciplineTrackerService';
import { updateDisciplineTrackerRowSchema } from '@/lib/validations/disciplineTracker';
import { ZodError } from 'zod';

/**
 * GET /api/discipline-tracker/rows/[id]
 * Get a single row by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const accountId = request.nextUrl.searchParams.get('accountId') || undefined;
    const row = await getRowById(session.user.id, id, accountId);

    if (!row) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Row not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: row });
  } catch (error) {
    console.error('[GET /api/discipline-tracker/rows/[id]]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch row' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/discipline-tracker/rows/[id]
 * Update a row
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const accountId = body.accountId || undefined;

    // Check if row exists
    const existingRow = await getRowById(session.user.id, id, accountId);
    if (!existingRow) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Row not found' } },
        { status: 404 }
      );
    }
    
    // Convert date string to Date object if needed
    if (body.tradeDate && typeof body.tradeDate === 'string') {
      body.tradeDate = new Date(body.tradeDate);
    }

    // Validate input
    const validatedData = updateDisciplineTrackerRowSchema.parse(body);

    // If date is being changed, check for duplicates
    if (validatedData.tradeDate) {
      const exists = await dateExists(session.user.id, validatedData.tradeDate, id);
      if (exists) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DUPLICATE_DATE',
              message: 'A row for this date already exists',
            },
          },
          { status: 400 }
        );
      }
    }

    // Update row
    const updatedRow = await updateRow(session.user.id, id, validatedData);

    return NextResponse.json({
      success: true,
      data: updatedRow,
      message: 'Row updated successfully',
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid row data',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    console.error('[PATCH /api/discipline-tracker/rows/[id]]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update row' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/discipline-tracker/rows/[id]
 * Delete a row
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    await deleteRow(session.user.id, id);

    return NextResponse.json({
      success: true,
      message: 'Row deleted successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Row not found') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Row not found' } },
        { status: 404 }
      );
    }

    console.error('[DELETE /api/discipline-tracker/rows/[id]]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete row' } },
      { status: 500 }
    );
  }
}
