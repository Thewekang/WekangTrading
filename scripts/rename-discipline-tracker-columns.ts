import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const databaseUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!databaseUrl || !authToken) {
  throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set');
}

const client = createClient({
  url: databaseUrl,
  authToken: authToken,
});

async function renameDisciplineTrackerColumns() {
  console.log('Starting column rename migration...');

  try {
    // Check if old columns exist
    console.log('\n1. Checking current schema...');
    const tableInfo = await client.execute(`PRAGMA table_info(discipline_tracker_rows);`);
    console.log('Current columns:', tableInfo.rows.map((r: any) => r.name).join(', '));

    // Check if we need to migrate
    const hasOldColumns = tableInfo.rows.some((r: any) => r.name === 'aplus_confirmed');
    
    if (!hasOldColumns) {
      console.log('\n✓ Columns already renamed. No migration needed.');
      return;
    }

    console.log('\n2. Renaming columns...');
    
    // SQLite doesn't support RENAME COLUMN directly in older versions
    // We need to create a new table and copy data
    
    // Step 1: Create new table with correct column names
    await client.execute(`
      CREATE TABLE IF NOT EXISTS discipline_tracker_rows_new (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        trade_date INTEGER NOT NULL,
        notes TEXT DEFAULT '',
        trade1_outcome TEXT DEFAULT '',
        trade2_outcome TEXT DEFAULT '',
        trade3_outcome TEXT DEFAULT '',
        trade1_tp3_amount REAL DEFAULT 0,
        trade2_tp3_amount REAL DEFAULT 0,
        trade3_tp3_amount REAL DEFAULT 0,
        is_aplus_day INTEGER NOT NULL DEFAULT 0,
        is_range_expansion_day INTEGER NOT NULL DEFAULT 0,
        session_window TEXT NOT NULL DEFAULT 'non-prime',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
    console.log('✓ Created new table structure');

    // Step 2: Copy data from old table to new table
    await client.execute(`
      INSERT INTO discipline_tracker_rows_new
      SELECT 
        id,
        user_id,
        trade_date,
        notes,
        trade1_outcome,
        trade2_outcome,
        trade3_outcome,
        trade1_tp3_amount,
        trade2_tp3_amount,
        trade3_tp3_amount,
        aplus_confirmed as is_aplus_day,
        range_expansion_confirmed as is_range_expansion_day,
        session_window,
        created_at,
        updated_at
      FROM discipline_tracker_rows;
    `);
    console.log('✓ Copied data to new table');

    // Step 3: Drop old table
    await client.execute(`DROP TABLE discipline_tracker_rows;`);
    console.log('✓ Dropped old table');

    // Step 4: Rename new table to original name
    await client.execute(`ALTER TABLE discipline_tracker_rows_new RENAME TO discipline_tracker_rows;`);
    console.log('✓ Renamed new table');

    console.log('\n✅ Migration completed successfully!');
    console.log('Columns renamed:');
    console.log('  - aplus_confirmed → is_aplus_day');
    console.log('  - range_expansion_confirmed → is_range_expansion_day');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

renameDisciplineTrackerColumns()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
