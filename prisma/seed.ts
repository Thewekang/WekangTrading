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
    console.log('Creating admin user...');
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    user = await prisma.user.create({
      data: {
        email: 'admin@wekangtradingjournal.com',
        name: 'Admin',
        passwordHash: hashedPassword,
        role: 'ADMIN',
      },
    });
    console.log('✅ Admin user created:', user.email);
  } else {
    console.log('✅ Using existing user:', user.email);
  }

  // Clear existing trades for clean seed
  console.log('Clearing existing trade data...');
  await prisma.individualTrade.deleteMany({ where: { userId: user.id } });
  await prisma.dailySummary.deleteMany({ where: { userId: user.id } });
  console.log('✅ Existing data cleared');

  // Generate sample trades across 30 days with realistic patterns
  const trades = [];
  const now = new Date();

  // Helper to create a date at specific hour (UTC)
  const createDate = (daysAgo: number, hour: number, minute: number = 0) => {
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setUTCHours(hour, minute, 0, 0);
    return date;
  };

  // Generate 30 days of trading data
  for (let day = 0; day < 30; day++) {
    // Skip some days (weekends) - only trade 5 days per week
    if (day % 7 === 5 || day % 7 === 6) continue;

    const tradesPerDay = Math.floor(Math.random() * 3) + 3; // 3-5 trades per day
    
    for (let i = 0; i < tradesPerDay; i++) {
      // Randomly select session
      const sessionType = Math.random();
      let hour: number;
      let sessionName: string;
      let winChance: number;
      let sopChance: number;

      if (sessionType < 0.3) {
        // ASIA Session (00:00-09:00 UTC) - 70% win rate, 85% SOP
        hour = Math.floor(Math.random() * 9);
        sessionName = 'ASIA';
        winChance = 0.70;
        sopChance = 0.85;
      } else if (sessionType < 0.6) {
        // EUROPE Session (09:00-16:00 UTC) - 65% win rate, 80% SOP
        hour = 9 + Math.floor(Math.random() * 7);
        sessionName = 'EUROPE';
        winChance = 0.65;
        sopChance = 0.80;
      } else {
        // US Session (16:00-22:00 UTC) - 75% win rate, 90% SOP
        hour = 16 + Math.floor(Math.random() * 6);
        sessionName = 'US';
        winChance = 0.75;
        sopChance = 0.90;
      }

      const isWin = Math.random() < winChance;
      const followedSop = Math.random() < sopChance;
      
      // Profit/Loss: Wins average +$60, Losses average -$40
      const profitLoss = isWin 
        ? Math.floor(Math.random() * 50) + 35  // $35-$85
        : -(Math.floor(Math.random() * 40) + 20); // -$20 to -$60

      trades.push({
        timestamp: createDate(day, hour, Math.floor(Math.random() * 60)),
        result: isWin ? 'WIN' : 'LOSS',
        sop: followedSop,
        pl: profitLoss,
      });
    }
  }

  console.log(`\n📊 Creating ${trades.length} sample trades across 30 days...`);

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
  const totalSopCompliant = await prisma.individualTrade.count({
    where: { userId: user.id, sopFollowed: true }
  });
  
  const allTrades = await prisma.individualTrade.findMany({
    where: { userId: user.id },
    select: { profitLossUsd: true }
  });
  const totalProfit = allTrades.reduce((sum, t) => sum + t.profitLossUsd, 0);
  
  const sessionCounts = {
    ASIA: await prisma.individualTrade.count({ where: { userId: user.id, marketSession: 'ASIA' } }),
    EUROPE: await prisma.individualTrade.count({ where: { userId: user.id, marketSession: 'EUROPE' } }),
    US: await prisma.individualTrade.count({ where: { userId: user.id, marketSession: 'US' } }),
    OVERLAP: await prisma.individualTrade.count({ where: { userId: user.id, marketSession: 'OVERLAP' } }),
  };

  console.log(`Total Trades: ${totalTrades}`);
  console.log(`Total Wins: ${totalWins} (${((totalWins/totalTrades)*100).toFixed(1)}% win rate)`);
  console.log(`SOP Compliant: ${totalSopCompliant} (${((totalSopCompliant/totalTrades)*100).toFixed(1)}% SOP rate)`);
  console.log(`Total P/L: $${totalProfit.toFixed(2)}`);
  console.log(`Avg P/L per trade: $${(totalProfit/totalTrades).toFixed(2)}`);
  console.log('\nTrades by Session:');
  console.log(`  ASIA: ${sessionCounts.ASIA} trades`);
  console.log(`  EUROPE: ${sessionCounts.EUROPE} trades`);
  console.log(`  US: ${sessionCounts.US} trades`);
  console.log(`  OVERLAP: ${sessionCounts.OVERLAP} trades`);

  console.log('\n✨ Seed completed successfully!');
  console.log('🎯 You now have 30 days of realistic trading data for testing');
  console.log('💡 AI suggestions should show meaningful values based on this data');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
