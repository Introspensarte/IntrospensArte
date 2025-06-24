-- Migration script to fix existing database schema
-- Run this if the database was already created with the old schema

-- First, check if the column exists and rename it if needed
DO $$
BEGIN
    -- Check if wordCount column exists and rename it
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'activities' AND column_name = 'wordcount') THEN
        ALTER TABLE activities RENAME COLUMN wordcount TO word_count;
    END IF;

    -- Add word_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'activities' AND column_name = 'word_count') THEN
        ALTER TABLE activities ADD COLUMN word_count INTEGER NOT NULL DEFAULT 0;
    END IF;

    -- Update date column to timestamp if it's currently date
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'activities' AND column_name = 'date' AND data_type = 'date') THEN
        ALTER TABLE activities ALTER COLUMN date TYPE TIMESTAMP USING date::timestamp;
    END IF;
END $$;

-- Migration to add new columns to planned_activities table
ALTER TABLE planned_activities 
ADD COLUMN IF NOT EXISTS deadline TIMESTAMP,
ADD COLUMN IF NOT EXISTS facebook_link TEXT;

-- Add notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'general',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);