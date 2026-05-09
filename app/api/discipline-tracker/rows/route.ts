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
    const accountId = searchParams.get('accountId') || undefined;

    // Validate filters
    const filters = disciplineTrackerFilterSchema.parse({ month, search, sortBy });

    // Fetch rows
    const rows = await getUserRows(session.user.id, filters, accountId);

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid filter parameters',
            details: error.issues,
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

    // Validate input
    const validatedData = disciplineTrackerRowSchema.parse(body);
    const accountId: string | undefined = typeof body.accountId === 'string' ? body.accountId : undefined;
    
    // Convert date string to Date object for database
    const tradeDate = new Date(validatedData.tradeDate);

    // Check for duplicate date (per account)
    const exists = await dateExists(session.user.id, tradeDate, undefined, accountId);
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

    // Create row with proper data structure
    const newRow = await createRow(session.user.id, {
      tradeDate,
      tradingAccountId: accountId ?? null,
      notes: validatedData.notes || '',
      trade1Outcome: '',
      trade2Outcome: '',
      trade3Outcome: '',
      trade1Tp3Amount: 0,
      trade2Tp3Amount: 0,
      trade3Tp3Amount: 0,
      isAPlusDay: validatedData.isAPlusDay,
      isRangeExpansionDay: validatedData.isRangeExpansionDay,
      sessionWindow: validatedData.sessionWindow,
    });

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
            details: error.issues,
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
