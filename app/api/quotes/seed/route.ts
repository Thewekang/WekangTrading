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
import { eq } from 'drizzle-orm';
import quotesData from '@/public/data/quotes.json';

/**
 * POST /api/quotes/seed
 * Re-seed quotes from JSON file (admin only)
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

    let inserted = 0;
    let updated = 0;
    let errors = 0;

    // Process each quote
    for (const quote of quotesData.quotes) {
      try {
        // Check if quote exists
        const existingQuote = await db
          .select()
          .from(tradingQuotes)
          .where(eq(tradingQuotes.id, quote.id))
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
              sourceUrl: quote.sourceUrl,
              updatedAt: new Date(),
            })
            .where(eq(tradingQuotes.id, quote.id));
          
          updated++;
        } else {
          // Insert new quote
          await db.insert(tradingQuotes).values({
            id: quote.id,
            enabled: quote.enabled,
            category: quote.category,
            weight: quote.weight,
            textEn: quote.textEn,
            textBm: quote.textBm,
            author: quote.author,
            sourceType: quote.sourceType,
            sourceUrl: quote.sourceUrl || null,
            displayCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          
          inserted++;
        }
      } catch (error) {
        console.error(`Error processing quote ${quote.id}:`, error);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        total: quotesData.quotes.length,
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
