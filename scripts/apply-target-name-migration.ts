/**
 * Apply migration to add name column to user_targets table
 * Run with: npx tsx scripts/apply-target-name-migration.ts
 */

import { db } from '../lib/db';
import { sql } from 'drizzle-orm';
import { userTargets } from '../lib/db/schema';

async function applyMigration() {
  console.log('🔄 Applying migration: Add name column to user_targets...\n');

  try {
    // Step 1: Add name column (nullable)
    console.log('Step 1: Adding name column...');
    await db.run(sql`ALTER TABLE user_targets ADD COLUMN name TEXT`);
    console.log('✓ Column added\n');

    // Step 2: Update existing targets with default names
    console.log('Step 2: Updating existing targets with default names...');
    const result = await db.run(sql`
      UPDATE user_targets 
      SET name = CASE target_type
        WHEN 'WEEKLY' THEN 'Weekly Target'
        WHEN 'MONTHLY' THEN 'Monthly Target'
        WHEN 'YEARLY' THEN 'Yearly Target'
        ELSE 'Trading Target'
      END
      WHERE name IS NULL
    `);
    console.log(`✓ Updated ${result.rowsAffected} targets\n`);

    // Step 3: Verify
    console.log('Step 3: Verifying...');
    const targets = await db.select().from(userTargets);
    console.log(`Total targets: ${targets.length}`);
    targets.forEach((t) => {
      console.log(`  - "${t.name}" (${t.targetType}) - ${t.active ? 'Active' : 'Inactive'}`);
    });

    console.log('\n✅ Migration completed successfully!');
    console.log('Note: Schema enforces NOT NULL for new inserts, existing rows are now updated.');
  } catch (error: any) {
    if (error.message?.includes('duplicate column name')) {
      console.log('⚠️  Column already exists, updating names only...');
      
      const result = await db.run(sql`
        UPDATE user_targets 
        SET name = CASE target_type
          WHEN 'WEEKLY' THEN 'Weekly Target'
          WHEN 'MONTHLY' THEN 'Monthly Target'
          WHEN 'YEARLY' THEN 'Yearly Target'
          ELSE 'Trading Target'
        END
        WHERE name IS NULL OR name = ''
      `);
      console.log(`✓ Updated ${result.rowsAffected} targets`);
      console.log('✅ Migration verification complete!');
    } else {
      console.error('❌ Migration error:', error);
      process.exit(1);
    }
  }

  process.exit(0);
}

applyMigration();
