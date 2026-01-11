/**
 * Apply migration to add target_category column to user_targets table
 * Run with: npx tsx scripts/apply-target-category-migration.ts
 */

import { db } from '../lib/db';
import { sql } from 'drizzle-orm';
import { userTargets } from '../lib/db/schema';

async function applyMigration() {
  console.log('🔄 Applying migration: Add target_category column...\n');

  try {
    // Step 1: Add target_category column with default value
    console.log('Step 1: Adding target_category column...');
    await db.run(sql`ALTER TABLE user_targets ADD COLUMN target_category TEXT NOT NULL DEFAULT 'PERSONAL'`);
    console.log('✓ Column added with default value PERSONAL\n');

    // Step 2: Verify
    console.log('Step 2: Verifying...');
    const targets = await db.select().from(userTargets);
    console.log(`Total targets: ${targets.length}`);
    targets.forEach((t) => {
      console.log(`  - "${t.name}" - Category: ${t.targetCategory} (${t.targetType})`);
    });

    console.log('\n✅ Migration completed successfully!');
    console.log('All existing targets set to PERSONAL by default.');
    console.log('You can now create new Prop Firm targets from the UI.');
  } catch (error: any) {
    if (error.message?.includes('duplicate column name')) {
      console.log('⚠️  Column already exists, skipping...');
      console.log('✅ Migration verification complete!');
    } else {
      console.error('❌ Migration error:', error);
      process.exit(1);
    }
  }

  process.exit(0);
}

applyMigration();
