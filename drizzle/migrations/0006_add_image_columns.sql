-- Migration 0006: Add dedicated columns for images and notes
-- Separates images and notes from the content field for better performance and querying

-- Add new columns for images (JSON arrays of base64 strings)
ALTER TABLE sop_types ADD COLUMN detailImagesShort TEXT;
ALTER TABLE sop_types ADD COLUMN detailImagesLong TEXT;

-- Add new columns for chart notes (plain text)
ALTER TABLE sop_types ADD COLUMN detailImageNotesShort TEXT;
ALTER TABLE sop_types ADD COLUMN detailImageNotesLong TEXT;

-- Comments for clarity
COMMENT ON COLUMN sop_types.detailImagesShort IS 'JSON array of base64-encoded images for SHORT entry strategy';
COMMENT ON COLUMN sop_types.detailImagesLong IS 'JSON array of base64-encoded images for LONG entry strategy';
COMMENT ON COLUMN sop_types.detailImageNotesShort IS 'Chart notes and annotations for SHORT entry strategy';
COMMENT ON COLUMN sop_types.detailImageNotesLong IS 'Chart notes and annotations for LONG entry strategy';
