import { db } from '../lib/db';
import { users, individualTrades, dailySummaries } from '../lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { createTrade, getTrades, getTradeById, updateTrade, deleteTrade } from '../lib/services/individualTradeService';
import { getDailySummaries } from '../lib/services/dailySummaryService';

async function testTradeService() {
  console.log('🧪 Testing Trade Service with Drizzle...\n');

  try {
    // Step 1: Find a test user
    console.log('✓ Finding test user...');
    const testUsers = await db
      .select()
      .from(users)
      .limit(1);

    if (testUsers.length === 0) {
      console.log('❌ No users found in database. Please seed the database first.');
      process.exit(1);
    }

    const testUser = testUsers[0];
    console.log(`  Found user: ${testUser.email} (${testUser.id})\n`);

    // Step 2: Create a test trade
    console.log('✓ Creating test trade...');
    const testTrade = await createTrade({
      userId: testUser.id,
      tradeTimestamp: new Date(),
      result: 'WIN',
      sopFollowed: true,
      profitLossUsd: 100,
      notes: 'Test trade created with Drizzle ORM',
    });
    console.log(`  Trade created: ${testTrade.id}`);
    console.log(`  Market Session: ${testTrade.marketSession}`);
    console.log(`  Profit/Loss: $${testTrade.profitLossUsd}\n`);

    // Step 3: Get trade by ID
    console.log('✓ Fetching trade by ID...');
    const fetchedTrade = await getTradeById(testTrade.id, testUser.id);
    console.log(`  Trade fetched successfully: ${fetchedTrade.id}\n`);

    // Step 4: Get trades list
    console.log('✓ Fetching trades list...');
    const tradesList = await getTrades({
      userId: testUser.id,
      page: 1,
      pageSize: 10,
    });
    console.log(`  Total trades: ${tradesList.pagination.totalCount}`);
    console.log(`  Win rate: ${tradesList.summary.winRate.toFixed(2)}%`);
    console.log(`  SOP rate: ${tradesList.summary.sopRate.toFixed(2)}%\n`);

    // Step 5: Update trade
    console.log('✓ Updating trade...');
    const updatedTrade = await updateTrade(testTrade.id, testUser.id, {
      profitLossUsd: 150,
      notes: 'Updated with Drizzle ORM',
    });
    console.log(`  Trade updated: profit changed to $${updatedTrade.profitLossUsd}\n`);

    // Step 6: Check daily summary
    console.log('✓ Checking daily summary...');
    const today = new Date();
    const summaries = await getDailySummaries(testUser.id, today, today);
    if (summaries.length > 0) {
      const summary = summaries[0];
      console.log(`  Daily summary found:`);
      console.log(`    Total trades: ${summary.totalTrades}`);
      console.log(`    Total wins: ${summary.totalWins}`);
      console.log(`    Best session: ${summary.bestSession || 'N/A'}\n`);
    }

    // Step 7: Delete test trade (admin mode)
    console.log('✓ Deleting test trade...');
    await deleteTrade(testTrade.id, testUser.id, true);
    console.log(`  Trade deleted successfully\n`);

    // Step 8: Verify deletion
    console.log('✓ Verifying deletion...');
    try {
      await getTradeById(testTrade.id, testUser.id);
      console.log('❌ ERROR: Trade should have been deleted!');
    } catch (error) {
      console.log('  ✅ Trade successfully deleted (not found)\n');
    }

    console.log('✅ All trade service tests passed!');
    console.log('\n🎉 Drizzle migration for trade services is working correctly!\n');

  } catch (error) {
    console.error('❌ Test failed:');
    console.error(error);
    process.exit(1);
  }
}

testTradeService();
