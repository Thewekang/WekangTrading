/**
 * Script to add default names to existing targets before migration
 * Run this BEFORE applying the migration that adds the NOT NULL constraint
 */

import { db } from '../lib/db';
import { userTargets } from '../lib/db/schema';
import { sql } from 'drizzle-orm';

async function addDefaultNames() {
  console.log('🔄 Adding default names to existing targets...\n');

  try {
    // First, add the column without NOT NULL constraint
    await db.run(sql`ALTER TABLE user_targets ADD COLUMN name TEXT`);
    console.log('✓ Added name column');

    // Update existing targets with default names based on targetType
    await db.run(sql`
      UPDATE user_targets 
      SET name = CASE targetType
        WHEN 'WEEKLY' THEN 'Weekly Target'
        WHEN 'MONTHLY' THEN 'Monthly Target'
        WHEN 'YEARLY' THEN 'Yearly Target'
        ELSE 'Trading Target'
      END
      WHERE name IS NULL
    `);
    console.log('✓ Updated existing targets with default names');

    // Verify
    const targets = await db.select().from(userTargets);
    console.log(`\n✓ Updated ${targets.length} targets`);
    targets.forEach((t) => {
      console.log(`  - ${t.name} (${t.targetType})`);
    });

    console.log('\n✅ Migration preparation complete!');
    console.log('Now you can apply the main migration with NOT NULL constraint.');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

addDefaultNames();
