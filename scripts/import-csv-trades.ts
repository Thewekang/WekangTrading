/**
 * CSV Trade Import Script
 * Usage: npm run db:import-csv
 * Environment variables loaded via tsx -r dotenv/config
 */

import { db } from '@/lib/db';
import { users, sopTypes, individualTrades } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// CSV data from trading propfirm.csv
const csvData = `Date & time;Result;SOP;SOP Type;Amount;;
1/09/2026 0:46;LOSS;YES;BB Mastery;-140.50;;
1/09/2026 0:46;LOSS;YES;BB Mastery;-97.00;;
1/09/2026 0:52;WIN;YES;BB Mastery;239.00;;
1/09/2026 0:51;WIN;YES;BB Mastery;174.00;;
1/09/2026 0:50;WIN;YES;BB Mastery;76.50;;
1/09/2026 0:50;WIN;YES;BB Mastery;66.50;;
1/09/2026 2:11;LOSS;NO;BB Mastery;-6.00;;
1/09/2026 2:03;LOSS;NO;BB Mastery;-127.00;;
1/09/2026 1:59;LOSS;NO;BB Mastery;-104.50;;
1/09/2026 1:57;LOSS;NO;BB Mastery;-123.50;;
1/09/2026 2:28;WIN;NO;W & M breakout;8.00;;
1/09/2026 2:28;LOSS;NO;W & M breakout;-68.00;;
1/09/2026 3:14;WIN;NO;W & M breakout;135.00;;
1/09/2026 3:14;WIN;NO;W & M breakout;75.00;;
1/09/2026 3:36;WIN;NO;W & M breakout;14.00;;
1/09/2026 3:36;LOSS;NO;W & M breakout;-58.00;;
1/09/2026 3:43;WIN;NO;W & M breakout;22.00;;
1/09/2026 3:55;WIN;NO;W & M breakout;4.00;;
1/09/2026 3:56;WIN;NO;W & M breakout;70.00;;
1/09/2026 3:56;WIN;NO;W & M breakout;21.00;;
1/09/2026 18:44;WIN;YES;BB Mastery;12.00;;
1/09/2026 18:49;WIN;YES;BB Mastery;138.00;;
1/09/2026 19:31;LOSS;YES;BB Mastery;-12.00;;
1/09/2026 19:45;WIN;YES;BB Mastery;2.00;;
1/09/2026 20:11;LOSS;YES;BB Mastery;-114.00;;
1/09/2026 21:14;WIN;YES;BB Mastery;100.00;;
1/09/2026 21:14;WIN;YES;BB Mastery;12.00;;
1/09/2026 21:14;LOSS;YES;BB Mastery;-4.00;;
1/09/2026 21:59;LOSS;YES;BB Mastery;-26.50;;
1/09/2026 21:59;LOSS;NO;BB Mastery;-33.50;;
1/09/2026 21:59;LOSS;NO;W & M breakout;-44.00;;
1/09/2026 21:59;WIN;NO;W & M breakout;7.50;;
1/09/2026 22:12;LOSS;NO;W & M breakout;-67.50;;
1/09/2026 22:11;LOSS;NO;W & M breakout;-211.50;;
1/09/2026 22:10;LOSS;NO;W & M breakout;-232.50;;
1/09/2026 22:12;WIN;NO;W & M breakout;3.00;;
1/09/2026 22:12;LOSS;NO;W & M breakout;0.00;;
1/09/2026 22:17;LOSS;NO;W & M breakout;-5.00;;
1/09/2026 22:17;LOSS;NO;W & M breakout;-305.00;;
1/09/2026 22:19;LOSS;NO;W & M breakout;-265.00;;
1/09/2026 22:22;WIN;NO;W & M breakout;280.00;;
1/09/2026 22:26;LOSS;NO;W & M breakout;-290.00;;
1/09/2026 22:30;WIN;NO;Engulfing Fail;130.00;;
1/09/2026 22:32;WIN;NO;Engulfing Fail;465.00;;
1/09/2026 22:34;WIN;NO;Engulfing Fail;655.00;;
1/09/2026 22:37;WIN;NO;Engulfing Fail;12.50;;
1/09/2026 22:38;WIN;NO;Engulfing Fail;235.00;;
1/09/2026 22:44;WIN;NO;Engulfing Fail;137.50;;
1/09/2026 22:45;WIN;NO;Engulfing Fail;20.00;;
1/09/2026 22:46;WIN;NO;Engulfing Fail;65.00;;
1/09/2026 22:51;WIN;NO;Engulfing Fail;137.50;;`;

interface ParsedTrade {
  dateTime: Date;
  result: 'WIN' | 'LOSS';
  sopFollowed: boolean;
  sopTypeName: string;
  amount: number;
}

function parseCSV(csvContent: string): ParsedTrade[] {
  const lines = csvContent.trim().split('\n');
  const trades: ParsedTrade[] = [];

  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const columns = line.split(';');
    if (columns.length < 5) continue;

    const [dateTimeStr, result, sop, sopTypeName, amountStr] = columns;

    // Parse date time (format: "1/09/2026 0:46")
    const [datePart, timePart] = dateTimeStr.split(' ');
    const [month, day, year] = datePart.split('/').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);
    
    const dateTime = new Date(year, month - 1, day, hours, minutes);

    // Parse other fields
    const parsedResult = result.trim() as 'WIN' | 'LOSS';
    const sopFollowed = sop.trim().toUpperCase() === 'YES';
    const amount = parseFloat(amountStr.trim());

    trades.push({
      dateTime,
      result: parsedResult,
      sopFollowed,
      sopTypeName: sopTypeName.trim(),
      amount,
    });
  }

  return trades;
}

async function importTrades() {
  console.log('🚀 Starting CSV trade import...\n');

  // 1. Find wtrader user
  console.log('📋 Looking for wtrader user...');
  const wtraderUsers = await db.select().from(users).where(eq(users.email, 'wtrader@wekang.com'));
  
  if (wtraderUsers.length === 0) {
    console.error('❌ Error: wtrader user not found. Please create user first.');
    console.log('   Email: wtrader@wekang.com');
    return;
  }

  const wtrader = wtraderUsers[0];
  console.log(`✅ Found user: ${wtrader.name} (${wtrader.email})\n`);

  // 2. Get all SOP types and create a mapping
  console.log('📋 Loading SOP types...');
  const allSopTypes = await db.select().from(sopTypes);
  
  const sopTypeMap = new Map<string, string>();
  allSopTypes.forEach(st => {
    sopTypeMap.set(st.name.toLowerCase(), st.id);
  });

  console.log(`✅ Loaded ${allSopTypes.length} SOP types:`);
  allSopTypes.forEach(st => console.log(`   - ${st.name}`));
  console.log('');

  // 3. Check if we need to create new SOP types
  const parsedTrades = parseCSV(csvData);
  const uniqueSopTypes = new Set(parsedTrades.map(t => t.sopTypeName));
  
  console.log('📋 Checking for missing SOP types...');
  const missingSopTypes: string[] = [];
  uniqueSopTypes.forEach(name => {
    if (!sopTypeMap.has(name.toLowerCase())) {
      missingSopTypes.push(name);
    }
  });

  if (missingSopTypes.length > 0) {
    console.log(`⚠️  Found ${missingSopTypes.length} missing SOP types:`);
    missingSopTypes.forEach(name => console.log(`   - ${name}`));
    console.log('\n📝 Creating missing SOP types...');
    
    for (const name of missingSopTypes) {
      const [newSopType] = await db.insert(sopTypes).values({
        name,
        description: `Imported from CSV - ${name}`,
        active: true,
        sortOrder: allSopTypes.length + missingSopTypes.indexOf(name),
      }).returning();
      
      sopTypeMap.set(name.toLowerCase(), newSopType.id);
      console.log(`   ✅ Created: ${name}`);
    }
    console.log('');
  } else {
    console.log('✅ All SOP types exist\n');
  }

  // 4. Calculate market session for each trade
  function calculateMarketSession(timestamp: Date): string {
    const hour = timestamp.getUTCHours();
    
    if (hour >= 0 && hour < 7) return 'ASIA';
    if (hour >= 7 && hour < 9) return 'ASIA_EUROPE_OVERLAP';
    if (hour >= 9 && hour < 13) return 'EUROPE';
    if (hour >= 13 && hour < 16) return 'EUROPE_US_OVERLAP';
    if (hour >= 16 && hour < 22) return 'US';
    return 'ASIA'; // 22-24
  }

  // 5. Insert trades
  console.log(`📋 Preparing to insert ${parsedTrades.length} trades...`);
  
  const tradesToInsert = parsedTrades.map(trade => ({
    userId: wtrader.id,
    tradeTimestamp: trade.dateTime,
    marketSession: calculateMarketSession(trade.dateTime),
    result: trade.result,
    sopFollowed: trade.sopFollowed,
    sopTypeId: sopTypeMap.get(trade.sopTypeName.toLowerCase()) || null,
    profitLossUsd: trade.amount,
    notes: null,
  }));

  console.log('\n📊 Trade Summary:');
  console.log(`   Total Trades: ${parsedTrades.length}`);
  console.log(`   Wins: ${parsedTrades.filter(t => t.result === 'WIN').length}`);
  console.log(`   Losses: ${parsedTrades.filter(t => t.result === 'LOSS').length}`);
  console.log(`   SOP Followed: ${parsedTrades.filter(t => t.sopFollowed).length}`);
  console.log(`   SOP Not Followed: ${parsedTrades.filter(t => !t.sopFollowed).length}`);
  
  const totalPL = parsedTrades.reduce((sum, t) => sum + t.amount, 0);
  console.log(`   Total P/L: $${totalPL.toFixed(2)}`);
  console.log('');

  console.log('💾 Inserting trades into database...');
  
  try {
    await db.insert(individualTrades).values(tradesToInsert);
    console.log(`✅ Successfully inserted ${parsedTrades.length} trades!\n`);
    
    console.log('🎉 Import complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run daily summary recalculation: npm run recalculate-summaries');
    console.log('   2. Check the trades in the app: /trades');
    console.log('   3. View dashboard: /dashboard');
    
  } catch (error) {
    console.error('❌ Error inserting trades:', error);
    throw error;
  }
}

// Run the import
importTrades()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
