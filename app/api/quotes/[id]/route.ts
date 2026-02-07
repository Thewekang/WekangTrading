/**
 * Single Quote API
 * GET /api/quotes/[id] - Get a single quote
 * PATCH /api/quotes/[id] - Update a quote (admin only)
 * DELETE /api/quotes/[id] - Delete a quote (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getQuoteById, updateQuote, deleteQuote } from '@/lib/services/quoteService';
import { updateQuoteSchema } from '@/lib/validations/quote';

/**
 * GET /api/quotes/[id]
 * Get a single quote by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { id } = await params;

    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const quote = await getQuoteById(id);

    if (!quote) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Quote not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { quote },
    });

  } catch (error) {
    console.error('[Quote API Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch quote',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/quotes/[id]
 * Update a quote (admin only)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { id } = await params;

    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Check admin role
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    // Check if quote exists
    const existingQuote = await getQuoteById(id);
    if (!existingQuote) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Quote not found' } },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = updateQuoteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid quote data',
            details: validation.error.format(),
          },
        },
        { status: 400 }
      );
    }

    // Update quote
    const updatedQuote = await updateQuote(id, validation.data);

    return NextResponse.json({
      success: true,
      data: { quote: updatedQuote },
      message: 'Quote updated successfully',
    });

  } catch (error) {
    console.error('[Quote API Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update quote',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/quotes/[id]
 * Delete a quote (admin only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { id } = await params;

    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Check admin role
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    // Check if quote exists
    const existingQuote = await getQuoteById(id);
    if (!existingQuote) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Quote not found' } },
        { status: 404 }
      );
    }

    // Delete quote
    await deleteQuote(id);

    return NextResponse.json({
      success: true,
      message: 'Quote deleted successfully',
    });

  } catch (error) {
    console.error('[Quote API Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete quote',
        },
      },
      { status: 500 }
    );
  }
}
