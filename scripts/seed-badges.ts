/**
 * Seed Badges Script - Populate initial badges into database
 * Run: npm run seed:badges
 */

import { db } from '@/lib/db';
import { badges } from '@/lib/db/schema';
import { INITIAL_BADGES } from '@/lib/db/seed/badges';
import { eq } from 'drizzle-orm';

async function seedBadges() {
  console.log('🎯 Starting badge seeding...');
  
  let inserted = 0;
  let skipped = 0;
  
  for (const badge of INITIAL_BADGES) {
    try {
      // Check if badge already exists
      const existing = await db.select().from(badges).where(eq(badges.id, badge.id)).limit(1);
      
      if (existing.length > 0) {
        console.log(`⏭️  Badge '${badge.name}' (${badge.id}) already exists, skipping...`);
        skipped++;
        continue;
      }
      
      // Insert badge
      await db.insert(badges).values(badge);
      console.log(`✅ Badge '${badge.name}' (${badge.id}) inserted`);
      inserted++;
    } catch (error) {
      console.error(`❌ Failed to insert badge '${badge.name}' (${badge.id}):`, error);
    }
  }
  
  console.log('\n📊 Seeding Summary:');
  console.log(`   ✅ Inserted: ${inserted} badges`);
  console.log(`   ⏭️  Skipped: ${skipped} badges`);
  console.log(`   🎯 Total: ${INITIAL_BADGES.length} badges in seed data\n`);
  
  // Display badges by category
  const categoryCounts: Record<string, number> = {};
  for (const badge of INITIAL_BADGES) {
    categoryCounts[badge.category] = (categoryCounts[badge.category] || 0) + 1;
  }
  
  console.log('📋 Badges by Category:');
  for (const [category, count] of Object.entries(categoryCounts)) {
    console.log(`   ${category}: ${count} badges`);
  }
  
  console.log('\n✨ Badge seeding complete!');
}

// Run seed
seedBadges()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });
