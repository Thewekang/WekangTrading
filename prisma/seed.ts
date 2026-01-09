/**
 * Database Seed Script
 * Generates realistic sample trading data for testing
 */

import { PrismaClient } from '@prisma/client';
import { calculateMarketSession } from '../lib/utils/marketSessions';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Get the first user (or create if none exists)
  let user = await prisma.user.findFirst();
  
  if (!user) {
    console.log('Creating test user...');
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    user = await prisma.user.create({
      data: {
        email: 'trader@example.com',
        name: 'Test Trader',
        passwordHash: hashedPassword,
        role: 'USER',
      },
    });
    console.log('✅ Test user created:', user.email);
  } else {
    console.log('✅ Using existing user:', user.email);
  }

  // Clear existing trades for clean seed
  console.log('Clearing existing trade data...');
  await prisma.individualTrade.deleteMany({ where: { userId: user.id } });
  await prisma.dailySummary.deleteMany({ where: { userId: user.id } });
  console.log('✅ Existing data cleared');

  // Generate sample trades across different sessions
  const trades = [];
  const now = new Date();

  // Helper to create a date at specific hour (UTC)
  const createDate = (daysAgo: number, hour: number, minute: number = 0) => {
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setUTCHours(hour, minute, 0, 0);
    return date;
  };

  // ASIA Session (00:00-09:00 UTC) - Good win rate
  trades.push(
    { timestamp: createDate(1, 2, 30), result: 'WIN', sop: true, pl: 50 },
    { timestamp: createDate(1, 4, 15), result: 'WIN', sop: true, pl: 75 },
    { timestamp: createDate(2, 3, 45), result: 'LOSS', sop: true, pl: -30 },
    { timestamp: createDate(2, 5, 20), result: 'WIN', sop: true, pl: 40 },
    { timestamp: createDate(3, 1, 10), result: 'WIN', sop: false, pl: 60 },
    { timestamp: createDate(3, 6, 30), result: 'LOSS', sop: true, pl: -45 },
    { timestamp: createDate(4, 4, 0), result: 'WIN', sop: true, pl: 55 },
  );

  // EUROPE Session (07:00-16:00 UTC) - Medium win rate
  trades.push(
    { timestamp: createDate(1, 9, 30), result: 'WIN', sop: true, pl: 45 },
    { timestamp: createDate(1, 11, 45), result: 'LOSS', sop: false, pl: -60 },
    { timestamp: createDate(2, 10, 15), result: 'WIN', sop: true, pl: 70 },
    { timestamp: createDate(2, 14, 30), result: 'LOSS', sop: true, pl: -40 },
    { timestamp: createDate(3, 12, 0), result: 'WIN', sop: true, pl: 50 },
    { timestamp: createDate(4, 11, 20), result: 'LOSS', sop: false, pl: -55 },
  );

  // US Session (13:00-22:00 UTC) - Best win rate
  trades.push(
    { timestamp: createDate(0, 14, 30), result: 'WIN', sop: true, pl: 80 },
    { timestamp: createDate(0, 16, 15), result: 'WIN', sop: true, pl: 65 },
    { timestamp: createDate(1, 15, 45), result: 'WIN', sop: true, pl: 70 },
    { timestamp: createDate(1, 18, 20), result: 'LOSS', sop: true, pl: -35 },
    { timestamp: createDate(2, 17, 0), result: 'WIN', sop: true, pl: 85 },
    { timestamp: createDate(2, 19, 30), result: 'WIN', sop: false, pl: 90 },
    { timestamp: createDate(3, 16, 45), result: 'WIN', sop: true, pl: 75 },
    { timestamp: createDate(3, 20, 10), result: 'WIN', sop: true, pl: 60 },
    { timestamp: createDate(4, 15, 30), result: 'LOSS', sop: true, pl: -50 },
    { timestamp: createDate(4, 21, 0), result: 'WIN', sop: true, pl: 55 },
  );

  // OVERLAP Session (07:00-09:00 and 13:00-16:00 UTC) - Some trades
  trades.push(
    { timestamp: createDate(1, 7, 30), result: 'WIN', sop: true, pl: 45 },
    { timestamp: createDate(2, 8, 15), result: 'WIN', sop: true, pl: 50 },
    { timestamp: createDate(3, 13, 30), result: 'LOSS', sop: false, pl: -40 },
    { timestamp: createDate(4, 14, 45), result: 'WIN', sop: true, pl: 55 },
  );

  console.log(`\n📊 Creating ${trades.length} sample trades...`);

  // Insert trades and let triggers handle daily summaries
  for (const trade of trades) {
    const marketSession = calculateMarketSession(trade.timestamp);
    
    await prisma.individualTrade.create({
      data: {
        userId: user.id,
        tradeTimestamp: trade.timestamp,
        result: trade.result as 'WIN' | 'LOSS',
        sopFollowed: trade.sop,
        profitLossUsd: trade.pl,
        marketSession,
      },
    });
  }

  console.log('✅ Sample trades created');

  // Now manually update daily summaries
  console.log('\n📈 Updating daily summaries...');
  const { updateDailySummaryForDate } = await import('../lib/services/dailySummaryService');
  
  // Get unique dates from trades
  const uniqueDates = [...new Set(trades.map(t => {
    const d = new Date(t.timestamp);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }))];

  for (const dateStr of uniqueDates) {
    const date = new Date(dateStr);
    await updateDailySummaryForDate(user.id, date);
  }

  console.log('✅ Daily summaries updated');

  // Display summary
  console.log('\n📊 Seed Summary:');
  const totalTrades = await prisma.individualTrade.count({ where: { userId: user.id } });
  const totalWins = await prisma.individualTrade.count({ 
    where: { userId: user.id, result: 'WIN' } 
  });
  
  const sessionCounts = {
    ASIA: await prisma.individualTrade.count({ where: { userId: user.id, marketSession: 'ASIA' } }),
    EUROPE: await prisma.individualTrade.count({ where: { userId: user.id, marketSession: 'EUROPE' } }),
    US: await prisma.individualTrade.count({ where: { userId: user.id, marketSession: 'US' } }),
    OVERLAP: await prisma.individualTrade.count({ where: { userId: user.id, marketSession: 'OVERLAP' } }),
  };

  console.log(`Total Trades: ${totalTrades}`);
  console.log(`Total Wins: ${totalWins} (${((totalWins/totalTrades)*100).toFixed(1)}%)`);
  console.log('\nTrades by Session:');
  console.log(`  ASIA: ${sessionCounts.ASIA} trades`);
  console.log(`  EUROPE: ${sessionCounts.EUROPE} trades`);
  console.log(`  US: ${sessionCounts.US} trades`);
  console.log(`  OVERLAP: ${sessionCounts.OVERLAP} trades`);

  console.log('\n✨ Seed completed successfully!');
  console.log('🎯 Expected: US session should be your best trading session (80% win rate)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
