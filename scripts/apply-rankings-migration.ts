import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function applyMigration() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  try {
    console.log('Applying migration to create user_rankings table...');
    
    // Create table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS user_rankings (
        id text PRIMARY KEY NOT NULL,
        user_id text NOT NULL,
        rank integer NOT NULL,
        total_users integer NOT NULL,
        win_rate real NOT NULL,
        sop_rate real NOT NULL,
        total_pnl real NOT NULL,
        total_trades integer NOT NULL,
        percentile real NOT NULL,
        rank_change integer DEFAULT 0 NOT NULL,
        calculated_at integer NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE no action ON DELETE cascade
      )
    `);
    
    console.log('✓ Table created');
    
    // Create indexes
    await client.execute(`CREATE INDEX IF NOT EXISTS user_rankings_user_id_idx ON user_rankings (user_id)`);
    console.log('✓ Index user_id created');
    
    await client.execute(`CREATE INDEX IF NOT EXISTS user_rankings_calculated_at_idx ON user_rankings (calculated_at)`);
    console.log('✓ Index calculated_at created');
    
    await client.execute(`CREATE INDEX IF NOT EXISTS user_rankings_rank_idx ON user_rankings (rank)`);
    console.log('✓ Index rank created');
    
    console.log('\n✅ Migration applied successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.close();
  }
}

applyMigration();
