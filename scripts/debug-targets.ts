/**
 * Debug script to check user_targets data
 */

import { db } from '../lib/db';
import { userTargets } from '../lib/db/schema';

async function debugTargets() {
  console.log('\n🔍 Debugging User Targets\n');
  console.log('='.repeat(80));
  
  try {
    // Get all targets
    const allTargets = await db.select().from(userTargets);
    
    console.log(`\nTotal targets in database: ${allTargets.length}\n`);
    
    if (allTargets.length === 0) {
      console.log('⚠️  No targets found in database');
      console.log('This is why the dashboard query returns empty results.\n');
      return;
    }
    
    // Show each target with date info
    for (const target of allTargets) {
      console.log(`Target ID: ${target.id}`);
      console.log(`  User ID: ${target.userId}`);
      console.log(`  Type: ${target.targetType}`);
      console.log(`  Active: ${target.active}`);
      console.log(`  Start Date (raw): ${target.startDate}`);
      console.log(`  Start Date (parsed): ${new Date(target.startDate)}`);
      console.log(`  End Date (raw): ${target.endDate}`);
      console.log(`  End Date (parsed): ${new Date(target.endDate)}`);
      console.log(`  Created: ${target.createdAt}`);
      console.log('');
    }
    
    // Show current timestamp for comparison
    const now = new Date();
    console.log('Current timestamp:');
    console.log(`  Date object: ${now}`);
    console.log(`  Milliseconds: ${now.getTime()}`);
    console.log(`  Seconds: ${Math.floor(now.getTime() / 1000)}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  console.log('\n' + '='.repeat(80) + '\n');
}

debugTargets().then(() => {
  console.log('✅ Debug completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Debug failed:', error);
  process.exit(1);
});
