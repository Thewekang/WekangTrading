/**
 * Quote Seed API
 * POST /api/quotes/seed - Re-seed quotes from JSON file (admin only)
 * 
 * This endpoint runs the seed script to update/insert quotes from public/data/quotes.json
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { tradingQuotes } from '@/lib/db/schema/tradingQuotes';
import { eq, like } from 'drizzle-orm';
import quotesDataImport from '@/public/data/quotes.json';

const quotesData = quotesDataImport as Array<{
  id: string;
  enabled: boolean;
  category: 'discipline' | 'loss' | 'win' | 'confidence' | 'patience' | 'overtrading' | 'risk' | 'mental' | 'general';
  weight: number;
  textEn: string;
  textBm: string;
  author: string;
  sourceType: 'original' | 'publicFigure';
}>;

/**
 * Generate unique quote ID based on category and running number
 * Format: q-{category}-{number} (e.g., q-discipline-001)
 */
async function generateQuoteId(category: string): Promise<string> {
  // Get all existing quotes for this category
  const existingQuotes = await db
    .select({ id: tradingQuotes.id })
    .from(tradingQuotes)
    .where(like(tradingQuotes.id, `q-${category}-%`))
    .all();

  // Extract numbers from existing IDs
  const numbers = existingQuotes
    .map(q => {
      const match = q.id.match(/q-\w+-(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(n => !isNaN(n));

  // Get next number (max + 1, or 1 if no existing quotes)
  const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;

  // Format with leading zeros (3 digits)
  const paddedNumber = nextNumber.toString().padStart(3, '0');

  return `q-${category}-${paddedNumber}`;
}

/**
 * POST /api/quotes/seed
 * Re-seed quotes from JSON file or uploaded data (admin only)
 */
export async function POST(req: NextRequest) {
  try {
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

    // Try to get quotes from request body, fallback to default JSON file
    let quotesToSeed = quotesData;
    try {
      const body = await req.json();
      if (body.quotes && Array.isArray(body.quotes)) {
        quotesToSeed = body.quotes;
      }
    } catch (e) {
      // No body or invalid JSON, use default quotes.json
    }

    let inserted = 0;
    let updated = 0;
    let errors = 0;

    // Process each quote
    for (const quote of quotesToSeed) {
      try {
        // Generate ID if not provided
        let quoteId = quote.id;
        if (!quoteId) {
          quoteId = await generateQuoteId(quote.category);
        }

        // Check if quote exists
        const existingQuote = await db
          .select()
          .from(tradingQuotes)
          .where(eq(tradingQuotes.id, quoteId))
          .get();

        if (existingQuote) {
          // Update existing quote
          await db
            .update(tradingQuotes)
            .set({
              enabled: quote.enabled,
              category: quote.category,
              weight: quote.weight,
              textEn: quote.textEn,
              textBm: quote.textBm,
              author: quote.author,
              sourceType: quote.sourceType,
              updatedAt: new Date(),
            })
            .where(eq(tradingQuotes.id, quoteId));
          
          updated++;
        } else {
          // Insert new quote
          await db.insert(tradingQuotes).values({
            id: quoteId,
            enabled: quote.enabled,
            category: quote.category,
            weight: quote.weight,
            textEn: quote.textEn,
            textBm: quote.textBm,
            author: quote.author,
            sourceType: quote.sourceType,
            displayCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          
          inserted++;
        }
      } catch (error) {
        console.error(`Error processing quote:`, error);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        total: quotesToSeed.length,
        inserted,
        updated,
        errors,
      },
      message: `Quotes seeded successfully. Inserted: ${inserted}, Updated: ${updated}, Errors: ${errors}`,
    });

  } catch (error) {
    console.error('[Quote Seed API Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to seed quotes',
        },
      },
      { status: 500 }
    );
  }
}
