import { db } from './lib/db';
import { individualTrades, users } from './lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

async function checkTraderTrades() {
  const user = await db.select().from(users).where(eq(users.email, 'trader@trader.com')).limit(1);
  
  if (!user[0]) {
    console.log('User not found');
    return;
  }
  
  console.log('User ID:', user[0].id);
  console.log('Timezone:', user[0].preferredTimezone);
  
  const startDate = new Date('2026-01-01T00:00:00Z');
  const endDate = new Date('2026-01-31T23:59:59Z');
  
  const trades = await db
    .select()
    .from(individualTrades)
    .where(
      and(
        eq(individualTrades.userId, user[0].id),
        gte(individualTrades.tradeTimestamp, startDate),
        lte(individualTrades.tradeTimestamp, endDate)
      )
    );
  
  console.log('\nTrades found:', trades.length);
  console.log('\nTrade details:');
  trades.forEach((t, i) => {
    console.log(`${i + 1}. ${new Date(t.tradeTimestamp).toISOString()} - Result: ${t.result}, P/L: $${t.profitLossUsd}`);
  });
}

checkTraderTrades().catch(console.error);
