/**
 * Debug script to check database tables
 */

import { createClient } from '@libsql/client';

async function checkTables() {
  console.log('\n🔍 Checking Database Tables\n');
  console.log('='.repeat(80));
  
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });
  
  try {
    // List all tables
    const result = await client.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name;
    `);
    
    console.log(`\nTotal tables: ${result.rows.length}\n`);
    
    for (const row of result.rows) {
      console.log(`  📋 ${row.name}`);
    }
    
    // Check specifically for user_targets
    console.log('\n' + '='.repeat(80));
    const targetTable = result.rows.find(row => row.name === 'user_targets');
    
    if (targetTable) {
      console.log('\n✅ user_targets table EXISTS');
      
      // Get table info
      const tableInfo = await client.execute('PRAGMA table_info(user_targets);');
      console.log('\nColumns:');
      for (const col of tableInfo.rows) {
        console.log(`  - ${col.name} (${col.type})`);
      }
    } else {
      console.log('\n❌ user_targets table DOES NOT EXIST');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.close();
  }
  
  console.log('\n' + '='.repeat(80) + '\n');
}

checkTables().then(() => {
  console.log('✅ Check completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Check failed:', error);
  process.exit(1);
});
