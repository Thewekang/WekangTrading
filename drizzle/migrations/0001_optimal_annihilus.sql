-- Add name column (nullable first)
ALTER TABLE `user_targets` ADD `name` text;

-- Update existing targets with default names
UPDATE `user_targets` 
SET `name` = CASE `target_type`
  WHEN 'WEEKLY' THEN 'Weekly Target'
  WHEN 'MONTHLY' THEN 'Monthly Target'
  WHEN 'YEARLY' THEN 'Yearly Target'
  ELSE 'Trading Target'
END
WHERE `name` IS NULL;

-- Note: SQLite doesn't support ALTER COLUMN to add NOT NULL
-- The schema definition handles new inserts