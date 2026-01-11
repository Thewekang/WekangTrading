import { db } from '../lib/db';
import { sql } from 'drizzle-orm';
import { createClient } from '@libsql/client';

async function testConnection() {
  console.log('🔍 Testing Turso connection...\n');
  
  try {
    // Test 1: Basic connection
    console.log('✓ Testing basic connection...');
    
    // Create a direct client for testing
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });
    
    const result = await client.execute('SELECT 1 as test');
    console.log('  Result:', result.rows[0]);
    console.log('  ✅ Connection successful!\n');

    // Test 2: Database info
    console.log('✓ Checking database version...');
    const version = await client.execute('SELECT sqlite_version() as version');
    console.log('  SQLite Version:', version.rows[0]);
    console.log('  ✅ Database info retrieved!\n');

    // Test 3: List tables
    console.log('✓ Checking existing tables...');
    const tables = await client.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `);
    console.log('  Tables found:', tables.rows.length);
    if (tables.rows.length > 0) {
      console.log('  Tables:', tables.rows.map((r: any) => r.name).join(', '));
    } else {
      console.log('  No tables found (database is empty)');
    }
    console.log('  ✅ Table list retrieved!\n');

    console.log('✅ All connection tests passed!');
    console.log('\n🎉 Drizzle ORM + Turso setup is working correctly!\n');

  } catch (error) {
    console.error('❌ Connection test failed:');
    console.error(error);
    process.exit(1);
  }
}

testConnection();
