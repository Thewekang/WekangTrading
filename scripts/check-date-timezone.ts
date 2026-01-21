/**
 * Check date timezone handling in trades and streaks
 */

import { db } from '../lib/db';
import { individualTrades, dailySummaries, streaks, users } from '../lib/db/schema';
import { eq, desc } from 'drizzle-orm';

async function checkDateTimezone() {
  console.log('🔍 DATE TIMEZONE ANALYSIS\n');
  console.log('═══════════════════════════════════════════════\n');

  // Get trader user
  const [trader] = await db
    .select()
    .from(users)
    .where(eq(users.email, 'trader@trader.com'))
    .limit(1);

  if (!trader) {
    console.log('❌ Trader user not found!');
    return;
  }

  console.log(`👤 User: ${trader.email} (${trader.id})\n`);

  // Get all trades
  const trades = await db
    .select()
    .from(individualTrades)
    .where(eq(individualTrades.userId, trader.id))
    .orderBy(individualTrades.tradeTimestamp);

  console.log(`📊 Total Trades: ${trades.length}\n`);

  // Group by date (UTC vs Local)
  console.log('📅 TRADE DATES (comparing UTC vs Local extraction):\n');
  
  const dateGroups = new Map<string, {
    utcDate: string;
    localDate: string;
    trades: any[];
    profit: number;
  }>();

  trades.forEach(trade => {
    const timestamp = new Date(trade.tradeTimestamp);
    
    // UTC date extraction (what code uses)
    const utcDateStr = timestamp.toISOString().split('T')[0];
    
    // Local date extraction (what user sees)
    const localDateStr = timestamp.toLocaleDateString('en-CA'); // YYYY-MM-DD format
    
    // Also show both representations
    const utcDisplay = timestamp.toISOString();
    const localDisplay = timestamp.toLocaleString('en-US', { 
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZoneName: 'short'
    });

    if (!dateGroups.has(utcDateStr)) {
      dateGroups.set(utcDateStr, {
        utcDate: utcDateStr,
        localDate: localDateStr,
        trades: [],
        profit: 0
      });
    }

    const group = dateGroups.get(utcDateStr)!;
    group.trades.push({
      timestamp,
      utcDisplay,
      localDisplay,
      result: trade.result,
      profit: trade.profitLossUsd
    });
    group.profit += trade.profitLossUsd;
  });

  // Display date groups
  const sortedDates = Array.from(dateGroups.values()).sort((a, b) => 
    a.utcDate.localeCompare(b.utcDate)
  );

  sortedDates.forEach((group, index) => {
    const isWin = group.profit > 0;
    console.log(`   ${index + 1}. UTC Date: ${group.utcDate} | Local Date: ${group.localDate}`);
    console.log(`      Trades: ${group.trades.length} | Profit: $${group.profit.toFixed(2)} ${isWin ? '✅ WIN' : '❌ LOSS'}`);
    
    // Show first trade timestamp as example
    if (group.trades.length > 0) {
      const firstTrade = group.trades[0];
      console.log(`      Example: ${firstTrade.utcDisplay}`);
      console.log(`               ${firstTrade.localDisplay}`);
    }
    console.log();
  });

  // Check daily summaries
  console.log('\n💾 DAILY SUMMARIES TABLE:\n');
  const summaries = await db
    .select()
    .from(dailySummaries)
    .where(eq(dailySummaries.userId, trader.id))
    .orderBy(dailySummaries.tradeDate);

  summaries.forEach(summary => {
    const summaryDate = new Date(summary.tradeDate);
    const utcStr = summaryDate.toISOString().split('T')[0];
    const localStr = summaryDate.toLocaleDateString('en-CA');
    
    console.log(`   ${utcStr} (stored: ${summary.tradeDate})`);
    console.log(`      Profit: $${summary.totalProfitLossUsd.toFixed(2)} ${summary.totalProfitLossUsd > 0 ? '✅' : '❌'}`);
  });

  // Check streak records
  console.log('\n🔥 STREAK RECORDS:\n');
  const streakRecords = await db
    .select()
    .from(streaks)
    .where(eq(streaks.userId, trader.id));

  streakRecords.forEach(streak => {
    console.log(`   ${streak.streakType}:`);
    console.log(`      Current: ${streak.currentStreak} | Longest: ${streak.longestStreak}`);
    console.log(`      Last Date: ${streak.lastStreakDate || 'N/A'}`);
    console.log(`      Start Date: ${streak.startDate || 'N/A'}`);
  });

  // Calculate expected win streak manually
  console.log('\n🎯 EXPECTED WIN STREAK CALCULATION:\n');
  let currentStreak = 0;
  let longestStreak = 0;
  let prevDate: Date | null = null;

  sortedDates.forEach(group => {
    const currentDate = new Date(group.utcDate + 'T00:00:00Z');
    const isWin = group.profit > 0;

    if (isWin) {
      if (prevDate === null) {
        currentStreak = 1;
      } else {
        const diffDays = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Check if consecutive (allow weekends)
        const isConsecutive = diffDays <= 3 && 
          (diffDays === 1 || // Direct consecutive
           (prevDate.getDay() === 5 && currentDate.getDay() === 1 && diffDays === 3) || // Fri to Mon
           (prevDate.getDay() === 6 && currentDate.getDay() === 1 && diffDays === 2)); // Sat to Mon
        
        if (isConsecutive) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, currentStreak);
      prevDate = currentDate;
      
      console.log(`   ${group.utcDate}: Win #${currentStreak} (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][currentDate.getUTCDay()]})`);
    } else {
      if (currentStreak > 0) {
        console.log(`   ${group.utcDate}: ❌ Streak broken`);
      }
      currentStreak = 0;
      prevDate = null;
    }
  });

  console.log(`\n   📈 Final Current Streak: ${currentStreak}`);
  console.log(`   🏆 Final Longest Streak: ${longestStreak}`);

  console.log('\n═══════════════════════════════════════════════');
  console.log('✅ Analysis complete!\n');
}

checkDateTimezone().catch(console.error);
