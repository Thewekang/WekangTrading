/**
 * Migration Script: Apply 0006 and migrate existing JSON data
 * Adds dedicated columns for images and notes, then extracts data from JSON
 */

import { createClient } from '@libsql/client';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const databaseUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!databaseUrl || !authToken) {
  console.error('❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN');
  process.exit(1);
}

const db = createClient({
  url: databaseUrl,
  authToken: authToken,
});

async function applyMigration() {
  try {
    console.log('📦 Applying Migration 0006: Add image columns...\n');

    // Step 1: Add new columns
    console.log('1️⃣ Adding new columns...');
    
    await db.execute(`
      ALTER TABLE sop_types ADD COLUMN detail_images_short TEXT;
    `);
    await db.execute(`
      ALTER TABLE sop_types ADD COLUMN detail_images_long TEXT;
    `);
    await db.execute(`
      ALTER TABLE sop_types ADD COLUMN detail_image_notes_short TEXT;
    `);
    await db.execute(`
      ALTER TABLE sop_types ADD COLUMN detail_image_notes_long TEXT;
    `);
    
    console.log('   ✅ New columns added\n');

    // Step 2: Migrate existing data
    console.log('2️⃣ Migrating existing JSON data...');
    
    const result = await db.execute(`
      SELECT id, detail_content_short, detail_content_long 
      FROM sop_types 
      WHERE detail_content_short IS NOT NULL OR detail_content_long IS NOT NULL
    `);

    let migratedCount = 0;

    for (const row of result.rows) {
      const id = row.id as string;
      const updates: string[] = [];
      const values: any[] = [];

      // Process SHORT content
      if (row.detail_content_short) {
        try {
          const parsed = JSON.parse(row.detail_content_short as string);
          if (parsed.content !== undefined) {
            // Extract components
            const images = parsed.images || [];
            const notes = parsed.notes || '';
            
            // Update to just HTML content
            updates.push('detail_content_short = ?');
            values.push(parsed.content);
            
            // Store images as JSON array
            if (images.length > 0) {
              updates.push('detail_images_short = ?');
              values.push(JSON.stringify(images));
            }
            
            // Store notes as plain text
            if (notes) {
              updates.push('detail_image_notes_short = ?');
              values.push(notes);
            }
          }
        } catch {
          // Not JSON, skip
        }
      }

      // Process LONG content
      if (row.detail_content_long) {
        try {
          const parsed = JSON.parse(row.detail_content_long as string);
          if (parsed.content !== undefined) {
            // Extract components
            const images = parsed.images || [];
            const notes = parsed.notes || '';
            
            // Update to just HTML content
            updates.push('detail_content_long = ?');
            values.push(parsed.content);
            
            // Store images as JSON array
            if (images.length > 0) {
              updates.push('detail_images_long = ?');
              values.push(JSON.stringify(images));
            }
            
            // Store notes as plain text
            if (notes) {
              updates.push('detail_image_notes_long = ?');
              values.push(notes);
            }
          }
        } catch {
          // Not JSON, skip
        }
      }

      // Apply updates if any
      if (updates.length > 0) {
        values.push(id);
        await db.execute({
          sql: `UPDATE sop_types SET ${updates.join(', ')} WHERE id = ?`,
          args: values
        });
        migratedCount++;
        console.log(`   ✓ Migrated SOP type: ${id}`);
      }
    }

    console.log(`   ✅ Migrated ${migratedCount} SOP types\n`);

    // Step 3: Verify
    console.log('3️⃣ Verifying migration...');
    const verify = await db.execute(`
      SELECT 
        COUNT(*) as total,
        COUNT(detail_images_short) as hasImagesShort,
        COUNT(detail_images_long) as hasImagesLong,
        COUNT(detail_image_notes_short) as hasNotesShort,
        COUNT(detail_image_notes_long) as hasNotesLong
      FROM sop_types
    `);

    console.log('   Migration verification:');
    console.log(`   - Total SOP types: ${verify.rows[0].total}`);
    console.log(`   - With SHORT images: ${verify.rows[0].hasImagesShort}`);
    console.log(`   - With LONG images: ${verify.rows[0].hasImagesLong}`);
    console.log(`   - With SHORT notes: ${verify.rows[0].hasNotesShort}`);
    console.log(`   - With LONG notes: ${verify.rows[0].hasNotesLong}`);
    
    console.log('\n✅ Migration 0006 completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

applyMigration()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
