
-- Add activity_code column to planned_activities table
ALTER TABLE planned_activities ADD COLUMN IF NOT EXISTS activity_code TEXT;

-- Update existing records to have empty activity_code
UPDATE planned_activities SET activity_code = '' WHERE activity_code IS NULL;
