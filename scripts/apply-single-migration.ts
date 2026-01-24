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
  console.log('🚀 Applying migration 0005 (Short/Long entry categories) to Turso database...');
  
  const client = createClient({
    url: databaseUrl,
    authToken: authToken,
  });

  const db = drizzle(client);

  try {
    // Read the specific migration file - CHANGE THIS for each new migration
    const migrationPath = path.join(process.cwd(), 'drizzle', 'migrations', '0005_superb_thaddeus_ross.sql');
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
    
    console.log('✅ Migration 0005 applied successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
