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
  console.log('🚀 Applying migration 0004 (SOP details) to Turso database...');
  
  const client = createClient({
    url: databaseUrl,
    authToken: authToken,
  });

  const db = drizzle(client);

  try {
    // Read the specific migration file
    const migrationPath = path.join(process.cwd(), 'drizzle', 'migrations', '0004_many_unus.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('📝 Migration content:');
    console.log(sqlContent);
    console.log('\n⏳ Executing migration...');
    
    // Split by statement-breakpoint and execute each statement
    const statements = sqlContent.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s.length > 0);
    
    for (const statement of statements) {
      if (statement) {
        await client.execute(statement);
        console.log('✅ Statement executed successfully');
      }
    }
    
    console.log('✅ Migration 0004 applied successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
