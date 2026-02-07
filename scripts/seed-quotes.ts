/**
 * Seed Trading Quotes from JSON file
 * Run this script to populate the trading_quotes table with default quotes
 * 
 * Usage: npx tsx scripts/seed-quotes.ts
 */

import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { tradingQuotes } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const databaseUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!databaseUrl || !authToken) {
  console.error('❌ Missing environment variables: TURSO_DATABASE_URL or TURSO_AUTH_TOKEN');
  process.exit(1);
}

// Create database client
const client = createClient({
  url: databaseUrl,
  authToken: authToken,
});

const db = drizzle(client);

interface QuoteSeedData {
  id: string;
  enabled: boolean;
  category: string;
  weight: number;
  textEn: string;
  textBm: string;
  author?: string;
  sourceType?: string;
}

async function seedQuotes() {
  console.log('🌱 Starting quote seeding process...\n');

  try {
    // Check if quotes already exist
    const existingQuotes = await db.select({ count: tradingQuotes.id })
      .from(tradingQuotes)
      .all();

    if (existingQuotes.length > 0) {
      console.log(`⚠️  Found ${existingQuotes.length} existing quotes in database.`);
      console.log('   Skipping seed to prevent duplicates.');
      console.log('   To re-seed, delete all quotes first or use the admin "Reset to Defaults" button.\n');
      return;
    }

    // Read quotes from JSON file
    const jsonPath = path.join(process.cwd(), 'public', 'data', 'quotes.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf-8');
    const quotes: QuoteSeedData[] = JSON.parse(jsonData);

    console.log(`📖 Found ${quotes.length} quotes in seed file.\n`);

    // Insert quotes
    let successCount = 0;
    let errorCount = 0;

    for (const quote of quotes) {
      try {
        await db.insert(tradingQuotes).values({
          id: quote.id,
          enabled: quote.enabled,
          category: quote.category as any,
          weight: quote.weight,
          textEn: quote.textEn,
          textBm: quote.textBm,
          author: quote.author,
          sourceType: quote.sourceType as any,
          displayCount: 0,
        });
        successCount++;
        console.log(`✅ Inserted: ${quote.id} - "${quote.textEn.substring(0, 50)}..."`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to insert ${quote.id}:`, error);
      }
    }

    console.log(`\n✨ Seeding complete!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Total: ${quotes.length}\n`);

  } catch (error) {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seed function
seedQuotes()
  .then(() => {
    console.log('👍 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
