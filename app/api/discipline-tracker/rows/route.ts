import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getUserRows,
  createRow,
  dateExists,
} from '@/lib/services/disciplineTrackerService';
import {
  disciplineTrackerRowSchema,
  disciplineTrackerFilterSchema,
} from '@/lib/validations/disciplineTracker';
import { ZodError } from 'zod';

/**
 * GET /api/discipline-tracker/rows
 * Get all rows for the authenticated user with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || undefined;
    const search = searchParams.get('search') || undefined;
    const sortBy = searchParams.get('sortBy') as any || 'date-desc';

    // Validate filters
    const filters = disciplineTrackerFilterSchema.parse({ month, search, sortBy });

    // Fetch rows
    const rows = await getUserRows(session.user.id, filters);

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid filter parameters',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    console.error('[GET /api/discipline-tracker/rows]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch rows' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/discipline-tracker/rows
 * Create a new row
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Convert date string to Date object if needed
    if (typeof body.tradeDate === 'string') {
      body.tradeDate = new Date(body.tradeDate);
    }

    // Validate input
    const validatedData = disciplineTrackerRowSchema.parse(body);

    // Check for duplicate date
    const exists = await dateExists(session.user.id, validatedData.tradeDate);
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

    // Create row
    const newRow = await createRow(session.user.id, validatedData);

    return NextResponse.json(
      {
        success: true,
        data: newRow,
        message: 'Row created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid row data',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    console.error('[POST /api/discipline-tracker/rows]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create row' } },
      { status: 500 }
    );
  }
}
