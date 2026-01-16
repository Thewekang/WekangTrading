/**
 * Check trader's streaks and trade dates
 */

import { db } from '../lib/db';
import { users, individualTrades, streaks, userStats } from '../lib/db/schema';
import { eq, desc } from 'drizzle-orm';

async function checkTraderStreaks() {
  try {
    // Get trader
    const trader = await db.select().from(users).where(eq(users.email, 'trader@trader.com')).limit(1);
    if (trader.length === 0) {
      console.log('❌ Trader not found');
      return;
    }
    
    const traderId = trader[0].id;
    console.log('🔍 STREAK ANALYSIS FOR: trader@trader.com');
    console.log('═══════════════════════════════════════════════');
    console.log();
    
    // Get all trades ordered by date
    const trades = await db
      .select()
      .from(individualTrades)
      .where(eq(individualTrades.userId, traderId))
      .orderBy(desc(individualTrades.tradeTimestamp));
    
    console.log(`📊 Total Trades: ${trades.length}`);
    console.log();
    
    // Group trades by date
    const tradesByDate: Record<string, any[]> = {};
    trades.forEach(trade => {
      const date = new Date(trade.tradeTimestamp).toISOString().split('T')[0];
      if (!tradesByDate[date]) {
        tradesByDate[date] = [];
      }
      tradesByDate[date].push(trade);
    });
    
    const dates = Object.keys(tradesByDate).sort();
    
    console.log('📅 Trading Days:');
    dates.forEach(date => {
      const dayTrades = tradesByDate[date];
      const wins = dayTrades.filter(t => t.result === 'WIN').length;
      const losses = dayTrades.filter(t => t.result === 'LOSS').length;
      const totalProfit = dayTrades.reduce((sum, t) => sum + t.profitLossUsd, 0);
      const sopCompliant = dayTrades.filter(t => t.sopFollowed).length;
      
      const isDayWin = totalProfit > 0;
      const isDaySop = sopCompliant === dayTrades.length;
      
      console.log(`   ${date}: ${dayTrades.length} trades | ${wins}W ${losses}L | $${totalProfit.toFixed(2)} | ${isDayWin ? '✅ WIN' : '❌ LOSS'} | SOP: ${isDaySop ? '✅' : '❌'}`);
    });
    console.log();
    
    // Calculate WIN_STREAK (consecutive profitable days)
    console.log('🔥 WIN STREAK CALCULATION:');
    let currentWinStreak = 0;
    let longestWinStreak = 0;
    const sortedDates = dates.sort().reverse(); // Most recent first
    
    for (const date of sortedDates) {
      const dayTrades = tradesByDate[date];
      const totalProfit = dayTrades.reduce((sum, t) => sum + t.profitLossUsd, 0);
      
      if (totalProfit > 0) {
        currentWinStreak++;
        longestWinStreak = Math.max(longestWinStreak, currentWinStreak);
        console.log(`   ${date}: Profit $${totalProfit.toFixed(2)} ✅ Streak: ${currentWinStreak}`);
      } else {
        if (currentWinStreak > 0) {
          console.log(`   ${date}: Loss $${totalProfit.toFixed(2)} ❌ Streak broken at ${currentWinStreak}`);
        }
        currentWinStreak = 0;
      }
    }
    console.log(`   Current Streak: ${currentWinStreak} days`);
    console.log(`   Longest Streak: ${longestWinStreak} days`);
    console.log();
    
    // Calculate LOG_STREAK (consecutive logging days)
    console.log('📝 LOG STREAK CALCULATION:');
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    let currentLogStreak = 0;
    let longestLogStreak = 0;
    
    // Check if today or yesterday was logged
    const hasToday = tradesByDate[today] !== undefined;
    const hasYesterday = tradesByDate[yesterday] !== undefined;
    
    if (hasToday || hasYesterday) {
      currentLogStreak = 1;
      longestLogStreak = 1;
      console.log(`   Active: ${hasToday ? 'Today' : 'Yesterday'} logged ✅`);
    } else {
      console.log(`   Inactive: Last log was ${dates[dates.length - 1]} ❌`);
    }
    console.log(`   Current Streak: ${currentLogStreak} days`);
    console.log(`   Longest Streak: ${longestLogStreak} days`);
    console.log();
    
    // Calculate SOP_STREAK (consecutive SOP-compliant trades)
    console.log('✅ SOP STREAK CALCULATION:');
    let currentSopStreak = 0;
    let longestSopStreak = 0;
    
    for (const trade of trades.reverse()) {
      if (trade.sopFollowed) {
        currentSopStreak++;
        longestSopStreak = Math.max(longestSopStreak, currentSopStreak);
      } else {
        currentSopStreak = 0;
      }
    }
    console.log(`   Current Streak: ${currentSopStreak} trades`);
    console.log(`   Longest Streak: ${longestSopStreak} trades`);
    console.log();
    
    // Check streaks table
    console.log('💾 DATABASE STREAKS TABLE:');
    const dbStreaks = await db.select().from(streaks).where(eq(streaks.userId, traderId));
    if (dbStreaks.length === 0) {
      console.log('   ❌ No streak records found!');
    } else {
      dbStreaks.forEach(s => {
        console.log(`   ${s.streakType}: current=${s.currentStreak}, longest=${s.longestStreak}, last=${s.lastTradeDate}`);
      });
    }
    console.log();
    
    // Check user_stats table
    console.log('📈 USER STATS TABLE:');
    const stats = await db.select().from(userStats).where(eq(userStats.userId, traderId)).limit(1);
    if (stats.length === 0) {
      console.log('   ❌ No stats found!');
    } else {
      const s = stats[0];
      console.log(`   Current Win Streak: ${s.currentWinStreak}`);
      console.log(`   Longest Win Streak: ${s.longestWinStreak}`);
      console.log(`   Current Log Streak: ${s.currentLogStreak}`);
      console.log(`   Longest Log Streak: ${s.longestLogStreak}`);
      console.log(`   Current SOP Streak: ${s.currentSopStreak}`);
      console.log(`   Longest SOP Streak: ${s.longestSopStreak}`);
    }
    console.log();
    
    console.log('═══════════════════════════════════════════════');
    console.log('🎯 EXPECTED vs ACTUAL:');
    console.log(`   Expected Win Streak: ${longestWinStreak} days`);
    console.log(`   Actual in DB: ${stats[0]?.longestWinStreak || 0} days`);
    console.log();
    
    if (longestWinStreak > 0 && stats[0]?.longestWinStreak === 0) {
      console.log('❌ ISSUE: Streaks are NOT being updated!');
      console.log('   Trades were entered but streak services were not called.');
    }
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

checkTraderStreaks();
