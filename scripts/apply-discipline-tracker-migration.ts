import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const databaseUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!databaseUrl || !authToken) {
  console.error('❌ Missing environment variables: TURSO_DATABASE_URL or TURSO_AUTH_TOKEN');
  process.exit(1);
}

async function main() {
  console.log('🚀 Applying migration 0008 (discipline tracker) to Turso database...');
  
  const client = createClient({
    url: databaseUrl,
    authToken: authToken,
  });

  const db = drizzle(client);

  try {
    // Read the SQL migration file
    const migrationPath = path.join(process.cwd(), 'drizzle', 'migrations', '0008_handy_exodus.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📝 Running migration 0008...');
    
    // Split by statement-breakpoint and execute each statement
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      console.log(`  Executing: ${statement.substring(0, 50)}...`);
      await client.execute(statement);
    }

    console.log('✅ Migration 0008 applied successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.close();
  }
}

main();
