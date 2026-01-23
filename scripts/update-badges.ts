/**
 * Update Badges Script - Update existing badges with new descriptions
 */

import { db } from '../lib/db';
import { badges } from '../lib/db/schema';
import { INITIAL_BADGES } from '../lib/db/seed/badges';
import { eq } from 'drizzle-orm';

async function updateBadges() {
  console.log('🔄 Updating badge descriptions...\n');
  
  let updated = 0;
  let skipped = 0;
  
  for (const badge of INITIAL_BADGES) {
    try {
      // Check if badge exists
      const existing = await db.select().from(badges).where(eq(badges.id, badge.id)).limit(1);
      
      if (existing.length === 0) {
        console.log(`⏭️  Badge '${badge.name}' (${badge.id}) doesn't exist, skipping...`);
        skipped++;
        continue;
      }
      
      // Update badge
      await db
        .update(badges)
        .set({
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          requirement: badge.requirement,
          points: badge.points,
        })
        .where(eq(badges.id, badge.id));
      
      console.log(`✅ Badge '${badge.name}' (${badge.id}) updated`);
      updated++;
    } catch (error) {
      console.error(`❌ Failed to update badge '${badge.name}' (${badge.id}):`, error);
    }
  }
  
  console.log('\n📊 Update Summary:');
  console.log(`   ✅ Updated: ${updated} badges`);
  console.log(`   ⏭️  Skipped: ${skipped} badges`);
  console.log(`   🎯 Total: ${INITIAL_BADGES.length} badges in seed data\n`);
  
  console.log('✨ Badge update complete!');
}

// Run update
updateBadges()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Update failed:', error);
    process.exit(1);
  });
