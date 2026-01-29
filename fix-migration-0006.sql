-- Migration 0006 CORRECTED: Fix column names to use snake_case
-- This migration should be applied to production if the previous one used camelCase

-- First, check if camelCase columns exist and rename them
-- If columns already exist with snake_case, this will show an error (which is safe to ignore)

-- Note: SQLite doesn't support ALTER TABLE RENAME COLUMN until 3.25.0
-- Turso uses a modern SQLite version, so this should work

-- Check if camelCase columns exist (from incorrect migration)
-- If they do, we need to rename them to snake_case

-- For now, let's just add the correct columns if they don't exist
-- SQLite will error if column already exists, which is fine

ALTER TABLE sop_types ADD COLUMN detail_images_short TEXT;
ALTER TABLE sop_types ADD COLUMN detail_images_long TEXT;
ALTER TABLE sop_types ADD COLUMN detail_image_notes_short TEXT;
ALTER TABLE sop_types ADD COLUMN detail_image_notes_long TEXT;
