/**
 * Direct test of the exact query that's failing
 */

import { db } from '../lib/db';
import { userTargets } from '../lib/db/schema';
import { eq, and, lte, gte } from 'drizzle-orm';

async function testQuery() {
  console.log('\n🧪 Testing Exact Query from Error\n');
  console.log('='.repeat(80));
  
  const userId = '6700e20b-474f-44e1-967f-bc56876e7d26';
  const now = new Date();
  
  console.log('Query parameters:');
  console.log('  userId:', userId);
  console.log('  now:', now.toISOString());
  console.log('  now timestamp (ms):', now.getTime());
  console.log('  now timestamp (s):', Math.floor(now.getTime() / 1000));
  console.log('');
  
  try {
    console.log('Executing query...\n');
    
    const results = await db
      .select()
      .from(userTargets)
      .where(
        and(
          eq(userTargets.userId, userId),
          eq(userTargets.active, true),
          lte(userTargets.startDate, now),
          gte(userTargets.endDate, now)
        )
      );
    
    console.log(`✅ Query successful! Found ${results.length} targets`);
    
    if (results.length > 0) {
      console.log('\nResults:');
      for (const target of results) {
        console.log(`  - ${target.id}: ${target.targetType}`);
      }
    }
    
  } catch (error: any) {
    console.error('❌ Query failed:', error.message);
    console.error('\nError code:', error.code);
    console.error('Error details:', error);
  }
  
  console.log('\n' + '='.repeat(80) + '\n');
}

testQuery().then(() => {
  console.log('✅ Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
