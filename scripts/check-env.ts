/**
 * Debug script to check environment variables
 */

console.log('\n🔍 Environment Variables Check\n');
console.log('='.repeat(80));

console.log('\nTURSO_DATABASE_URL:', process.env.TURSO_DATABASE_URL ? '✅ Set' : '❌ Not set');
if (process.env.TURSO_DATABASE_URL) {
  console.log('Value:', process.env.TURSO_DATABASE_URL);
}

console.log('\nTURSO_AUTH_TOKEN:', process.env.TURSO_AUTH_TOKEN ? '✅ Set' : '❌ Not set');
if (process.env.TURSO_AUTH_TOKEN) {
  console.log('Value:', process.env.TURSO_AUTH_TOKEN.substring(0, 50) + '...');
}

console.log('\n' + '='.repeat(80) + '\n');

// Try to connect
import { createClient } from '@libsql/client';

async function testConnection() {
  try {
    console.log('Testing connection...\n');
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });
    
    const result = await client.execute('SELECT 1 as test');
    console.log('✅ Connection successful!');
    console.log('Result:', result.rows[0]);
    
    client.close();
  } catch (error: any) {
    console.error('❌ Connection failed:', error.message);
    console.error('Full error:', error);
  }
}

testConnection();
